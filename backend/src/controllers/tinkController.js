const axios = require('axios');
const pool = require('../models/db');
const qs = require('qs'); // Para serializar form-urlencoded

// Obtener un token de acceso con las credenciales de Tink
const getAccessToken = async () => {
  try {
    const payload = {
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope:
        'user:create user:read authorization:grant authorization:read credentials:refresh credentials:read credentials:write provider-consents:read provider-consents:write accounts:read balances:read transactions:read'
    };

    // Convertimos a form-urlencoded (qs.stringify) para /oauth/token
    const bodyString = qs.stringify(payload);

    const response = await axios.request({
      method: 'POST',
      url: 'https://api.tink.com/api/v1/oauth/token',
      data: bodyString,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error al obtener token de Tink:', error.response?.data || error.message);
    throw new Error('No se pudo obtener el token de acceso de Tink');
  }
};

// Crear una URL de autorización para conectar banco
exports.getAuthorizationLink = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const appUserId = req.user.id;

    // 1) Intentar obtener tinkUserId de nuestra BD
    const [rows] = await pool.query(
      'SELECT tink_user_id FROM tink_connections WHERE user_id = ? LIMIT 1',
      [appUserId]
    );

    let tinkUserId;
    if (rows.length > 0 && rows[0].tink_user_id) {
      // Ya existía: no llamamos a GET /user?external_user_id
      tinkUserId = rows[0].tink_user_id;
    } else {
      // 2) No existía en BD → Creamos usuario en Tink
      const externalUserId = `economix_user_${appUserId}`;
      const createUserPayload = {
        external_user_id: externalUserId,
        market: 'ES',
        locale: 'es_ES'
      };

      const createUserResponse = await axios.post(
        'https://api.tink.com/api/v1/user/create',
        createUserPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      tinkUserId = createUserResponse.data.user_id;

      // 3) Guardamos en BD (appUserId, tinkUserId)
      await pool.query(
        'INSERT INTO tink_connections (user_id, tink_user_id, tink_credentials_id, status, bank_name, created_at) VALUES (?, ?, NULL, "", "", NOW())',
        [appUserId, tinkUserId]
      );
    }

    // 4) Generar codigo de autorización (authorization-grant) – igual que antes
    const codePayload = {
      user_id: tinkUserId,
      scope: [
        'accounts:read',
        'balances:read',
        'transactions:read',
        'provider-consents:read',
        'credentials:refresh',
        'credentials:read',
        'credentials:write'
      ],
      id_hint: 'economix-app',
      actor_client_id: process.env.TINK_CLIENT_ID
    };
    const codeResponse = await axios.post(
      'https://api.tink.com/api/v1/oauth/authorization-grant',
      codePayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const authorizationCode = codeResponse.data.code;

    // 5) Construir URL de Tink Link y devolverla
    const redirectUri = `${req.protocol}://${req.get('host')}/api/tink/callback`;
    const tinkLinkUrl = `https://link.tink.com/1.0/transactions/connect-accounts?client_id=${
      process.env.TINK_CLIENT_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&authorization_code=${authorizationCode}&market=ES&locale=es_ES`;

    return res.json({ url: tinkLinkUrl, tink_user_id: tinkUserId });
  } catch (err) {
    console.error('Error al generar enlace de autorización:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Error al generar enlace de autorización' });
  }
};


// Manejar el callback después de la conexión de banco
exports.handleCallback = async (req, res) => {
  try {
    const { code, credentialsId } = req.query;
    if (!code) {
      return res.redirect('/connect?error=denied');
    }

    // 1) Obtener token de acceso (client_credentials)
    const accessToken = await getAccessToken();

    // 2) Intercambiar código de autorización por token de usuario (form-urlencoded)
    const tokenPayload = {
      code,
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      grant_type: 'authorization_code'
    };
    const tokenString = qs.stringify(tokenPayload);

    const tokenResponse = await axios.request({
      method: 'POST',
      url: 'https://api.tink.com/api/v1/oauth/token',
      data: tokenString,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const { access_token, user_id } = tokenResponse.data;

    // 3) Obtener información de la credencial recién creada
    const credentialResponse = await axios.get(
      `https://api.tink.com/api/v1/credentials/${credentialsId}`,
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    const credential = credentialResponse.data;

    // 4) Asociar esta conexión con el usuario de nuestra aplicación
    const appUserId = req.user.id;
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [appUserId]);
    if (users.length === 0) {
      return res.redirect('/connect?error=user_not_found');
    }

    // 5) Guardar (o actualizar) en nuestra base de datos la conexión Tink
    await pool.query(
      `INSERT INTO tink_connections 
         (user_id, tink_user_id, tink_credentials_id, status, bank_name, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         status = VALUES(status), 
         bank_name = VALUES(bank_name), 
         updated_at = NOW()`,
      [
        appUserId,
        user_id,
        credentialsId,
        credential.status,
        credential.providerName
      ]
    );

    return res.redirect('/connect?success=true');
  } catch (error) {
    console.error('Error en callback de Tink:', error.response?.data || error.message);
    return res.redirect('/connect?error=callback_error');
  }
};

// Obtener las conexiones bancarias del usuario
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const [connections] = await pool.query(
      `SELECT 
         id, 
         tink_user_id, 
         tink_credentials_id, 
         status, 
         bank_name, 
         created_at, 
         updated_at 
       FROM tink_connections 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.json({ connections });
  } catch (error) {
    console.error('Error al obtener conexiones:', error);
    return res.status(500).json({ message: 'Error al obtener conexiones' });
  }
};

// Eliminar una conexión bancaria
exports.deleteConnection = async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.user.id;

    // Verificar que esa conexión pertenece al usuario
    const [connections] = await pool.query(
      'SELECT tink_credentials_id, tink_user_id FROM tink_connections WHERE id = ? AND user_id = ?',
      [connectionId, userId]
    );
    if (connections.length === 0) {
      return res.status(404).json({ message: 'Conexión no encontrada' });
    }

    const { tink_credentials_id } = connections[0];

    // Obtener token de acceso
    const accessToken = await getAccessToken();

    // Intentar borrar las credenciales en Tink, pero si falla, continuamos
    try {
      await axios.delete(
        `https://api.tink.com/api/v1/credentials/${tink_credentials_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
    } catch (deleteError) {
      console.warn('Error al eliminar credenciales en Tink:', deleteError.response?.data || deleteError.message);
      // No detenemos el proceso si falla esto
    }

    // Borrar la fila de nuestra BD
    await pool.query('DELETE FROM tink_connections WHERE id = ? AND user_id = ?', [connectionId, userId]);

    return res.json({ message: 'Conexión eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar conexión:', error);
    return res.status(500).json({ message: 'Error al eliminar conexión' });
  }
};

// Sincronizar (refresh) una conexión existente
exports.syncConnection = async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.user.id;

    // Verificar que la conexión pertenece al usuario
    const [connections] = await pool.query(
      'SELECT tink_credentials_id, tink_user_id FROM tink_connections WHERE id = ? AND user_id = ?',
      [connectionId, userId]
    );
    if (connections.length === 0) {
      return res.status(404).json({ message: 'Conexión no encontrada' });
    }

    const { tink_credentials_id } = connections[0];

    // Obtener token de acceso
    const accessToken = await getAccessToken();

    // Enviar refresh a Tink
    await axios.post(
      `https://api.tink.com/api/v1/credentials/${tink_credentials_id}/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Marcar la conexión como “UPDATING” en nuestra BD
    await pool.query(
      'UPDATE tink_connections SET status = "UPDATING", updated_at = NOW() WHERE id = ?',
      [connectionId]
    );

    return res.json({ message: 'Sincronización iniciada correctamente' });
  } catch (error) {
    console.error('Error al sincronizar conexión:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Error al sincronizar conexión' });
  }
};
