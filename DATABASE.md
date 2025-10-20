Base de datos Messenger Brain Api

Las tablas aquí descritas constituyen la estructura básica de la aplicación Messenger Brain API, los campos aquí establecidos son definitivos, es decir no deben modificarse, sin embargo dada la naturaleza del proyecto se podrán agregar campos y tablas según sea la necesidad de los desarrolladores. Cualquier agregado a la base de datos debe ser posteada en el chat channel del proyecto en clickup app

Table users

id int identity, primary key
name nvachar(200) not null
email nvarchar(100) not null
updated_at date not null
created_at date not null
status_id FK user_status id
free_trial bit (true, false)
password nvarchar(200)


Table roles

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null

Table user_roles

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
user_id int FK users id
role_id int FK roles id
updated_at date not null
created_at date not null


Table user_status

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null

Table system_preferences

id int identity, primary key
slug nvachar(100) not null
name nvachar(200) not null
description nvachar(500) not null
updated_at date not null
created_at date not null

Registros por defecto de system_preferences

appearance 
two-factor

Table user_preferences

id int identity, primary key
user_id int FK users id 
system_preference_id FK system_preferences
status_id int FK  user_preferences_status id 
updated_at date not null
created_at date not null

Table user_preferences_status

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null

Table user_preferences_options

id int identity, primary key
user_preferences_id int FK user_preferences id 
slug nvachar(100) not null
value nvachar(100) not null
updated_at date not null
created_at date not null


Table tokens

id int identity, primary key
value nvachar(500) not null
token_type_id int FK token_types id
user_id int FK users id 
updated_at date not null
created_at date not null

Table token_types

id int identity, primary key
slug nvachar(100) not null
description nvarchar(500) not null
updated_at date not null
created_at date not null

Registros por defecto de token_types

personal_token

Table subscriptions

id int identity, primary key
slug nvachar(100) not null
description nvarchar(500) not null
suscription_status_id int FK subscriptions_status id
price double
updated_at date not null
created_at date not null


Table subscriptions_status

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null

Table suscriptions_features

id int identity, primary key
slug nvachar(100) not null
suscription_id int FK subscriptions id
value nvachar(1000) not null
updated_at date not null
created_at date not null


Table user_suscription

id int identity, primary key
user_subscription_id int FK subscriptions id 
user_suscription_status_id FK user_suscription_status id
updated_at date not null
created_at date not null


Table user_subscriptions_status

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null


Table user_activity

id int identity, primary key
slug nvachar(100) not null
description nvachar(1000) not null 
updated_at date not null
created_at date not null


Table whatsapp_sessions

id int identity, primary key
user_id int FK users id
phone_number 
whatsapp_session_status_id FK whatsapp_session_status id
account_protection bit
log_messages bit
webhook_url nvachar(MAX) 
webhook_enabled bit
browser_context_id FK browser_context id
updated_at date not null
created_at date not null


Table whatsapp_sessions_status

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null

Table browser_context
La tabla browser_context se utiliza para guardar la información del contexto del navegador de puppeter al que está asignada una sesión de whatsapp, de esta forma es más fácil ubicar ese contexto en puppeter para poder realizar acciones controladas como el envío de mensajes

id int identity, primary key
updated_at date not null
created_at date not null
browser_context_status_id FK browser_context_status id

Table browser_context_status

id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null

Registros por defecto de whatsapp_sessions_status
connecting
connected
disconnected
need_scan
logged_out
expired

Table messages
id int identity, primary key
remoteJid nvachar not null 
whatsapp_session_id FK whatsapp_session id
message_session_status_id FK message_session_status id
updated_at Timestamp not null
sent_at Timestamp not null
key JSON data
message JSON data
result JSON data
message_status
id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null


Table send_messages_jobs
id int identity, primary key
send_messages_jobs_status_id FK send_messages_jobs_status id
log JSON data
updated_at date not null
created_at date not null

Table send_messages_jobs_status
id int identity, primary key
slug nvachar(100) not null
description nvachar(500) not null 
updated_at date not null
created_at date not null


Table system_errors
id int identity, primary key
log nvarchar
updated_at date not null
created_at date not null



