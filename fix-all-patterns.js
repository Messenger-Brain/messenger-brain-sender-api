const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ALL naming patterns systematically...\n');

// ============================================================================
// REGLA FUNDAMENTAL:
// - Request/Response DTOs (interfaces): camelCase
// - Database models (columnas): snake_case
// - Where clauses de Sequelize: snake_case (nombres de columnas)
// - FilterQuery: camelCase (es un DTO)
// ============================================================================

function fixServiceFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const original = content;
  
  // 1. Acceso a Request DTOs - debe ser camelCase
  const dtoAccessPatterns = [
    [/(\w+Data)\.user_id\b/g, '$1.userId'],
    [/(\w+Data)\.role_id\b/g, '$1.roleId'],
    [/(\w+Data)\.status_id\b/g, '$1.statusId'],
    [/(\w+Data)\.subscription_id\b/g, '$1.subscriptionId'],
    [/(\w+Data)\.whatsapp_session_id\b/g, '$1.whatsappSessionId'],
    [/(\w+Data)\.phone_number\b/g, '$1.phoneNumber'],
    [/(\w+Data)\.account_protection\b/g, '$1.accountProtection'],
    [/(\w+Data)\.log_messages\b/g, '$1.logMessages'],
    [/(\w+Data)\.webhook_url\b/g, '$1.webhookUrl'],
    [/(\w+Data)\.webhook_enabled\b/g, '$1.webhookEnabled'],
    [/(\w+Data)\.browser_context_id\b/g, '$1.browserContextId'],
    [/(\w+Data)\.sent_at\b/g, '$1.sentAt'],
    [/(\w+Data)\.free_trial\b/g, '$1.freeTrial'],
    [/(\w+Data)\.system_preference_id\b/g, '$1.systemPreferenceId'],
    [/(\w+Data)\.token_type_id\b/g, '$1.tokenTypeId'],
  ];
  
  for (const [pattern, replacement] of dtoAccessPatterns) {
    content = content.replace(pattern, replacement);
  }
  
  // 2. FilterQuery debe usar camelCase (es un DTO)
  const filterQueryPatterns = [
    [/filters\.user_id\b/g, 'filters.userId'],
    [/filters\.status_id\b/g, 'filters.statusId'],
    [/filters\.subscription_id\b/g, 'filters.subscriptionId'],
  ];
  
  for (const [pattern, replacement] of filterQueryPatterns) {
    content = content.replace(pattern, replacement);
  }
  
  // 3. Where clauses - deben usar snake_case (nombres de columnas DB)
  // Patrones: where: { statusId } -> where: { status_id: statusId }
  const whereClausePatterns = [
    // Specific model where clauses
    [/where:\s*{\s*userId\s*}/g, 'where: { user_id: userId }'],
    [/where:\s*{\s*userId\s*,/g, 'where: { user_id: userId,'],
    [/where:\s*{\s*statusId\s*}/g, 'where: { status_id: statusId }'],
    [/where:\s*{\s*roleId\s*}/g, 'where: { role_id: roleId }'],
    [/where:\s*{\s*subscriptionId\s*}/g, 'where: { subscription_id: subscriptionId }'],
    [/where:\s*{\s*phoneNumber\s*}/g, 'where: { phone_number: phoneNumber }'],
    
    // Para Message model
    [/\bMessage\.findAndCountAll\(\s*{\s*where:\s*{\s*statusId/g, 'Message.findAndCountAll({ where: { message_session_status_id: statusId'],
    [/\bMessage\.count\(\s*{\s*where:\s*{\s*statusId/g, 'Message.count({ where: { message_session_status_id: statusId'],
    
    // Para SendMessageJob model
    [/\bSendMessageJob\.findAndCountAll\(\s*{\s*where:\s*{\s*statusId/g, 'SendMessageJob.findAndCountAll({ where: { send_messages_jobs_status_id: statusId'],
    [/\bSendMessageJob\.count\(\s*{\s*where:\s*{\s*statusId/g, 'SendMessageJob.count({ where: { send_messages_jobs_status_id: statusId'],
    [/\bSendMessageJob\.count\(\s*{\s*where:\s*{\s*status_id/g, 'SendMessageJob.count({ where: { send_messages_jobs_status_id'],
  ];
  
  for (const [pattern, replacement] of whereClausePatterns) {
    content = content.replace(pattern, replacement);
  }
  
  // 4. Shorthand properties en where clauses - necesitan mapeo explícito
  // { userId, ... } debe ser { user_id: userId, ... }
  const shorthandPatterns = [
    [/{\s*userId\s*,/g, '{ user_id: userId,'],
    [/,\s*userId\s*}/g, ', user_id: userId }'],
    [/,\s*userId\s*,/g, ', user_id: userId,'],
  ];
  
  for (const [pattern, replacement] of shorthandPatterns) {
    content = content.replace(pattern, replacement);
  }
  
  // 5. Funciones con parámetros renombrados - usar el parámetro correcto
  // getUserById(user_id: number) pero dentro usa userId
  const functionParamPatterns = [
    [/User\.findByPk\(userId\)/g, 'User.findByPk(user_id)'],
    [/this\.logger\.info\([^)]*{\s*userId\s*}/g, (match) => match.replace('{ userId }', '{ user_id }')],
  ];
  
  for (const [pattern, replacement] of functionParamPatterns) {
    if (typeof replacement === 'function') {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
  }
  
  // 6. Acceso a propiedades de modelos - debe ser camelCase (getters de Sequelize)
  const modelPropertyPatterns = [
    [/(\w+)\.created_at\b/g, '$1.createdAt'],
    [/(\w+)\.updated_at\b/g, '$1.updatedAt'],
  ];
  
  for (const [pattern, replacement] of modelPropertyPatterns) {
    // Solo aplicar si NO está en un where clause o create object
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      if (line.includes('where:') || line.includes('created_at:') || line.includes('updated_at:')) {
        return line; // No modificar estas líneas
      }
      return line.replace(pattern, replacement);
    });
    content = newLines.join('\n');
  }
  
  // 7. Create objects para SendMessageJob - debe usar snake_case
  content = content.replace(/status_id:\s*jobData\.statusId/g, 'send_messages_jobs_status_id: jobData.statusId');
  
  // 8. Create objects para Message - debe usar snake_case correcto
  content = content.replace(/status_id:\s*(\d+|messageData\.statusId)/g, 'message_session_status_id: $1');
  
  // 9. UserRole create - necesita user_id y role_id
  content = content.replace(/UserRole\.create\(\s*{\s*userId:/g, 'UserRole.create({ user_id:');
  content = content.replace(/UserRole\.create\(\s*{\s*user_id:\s*userId,\s*roleId:/g, 'UserRole.create({ user_id: userId, role_id:');
  
  // 10. WhatsAppSession where clauses
  content = content.replace(/WhatsAppSession\.findOne\(\s*{\s*where:\s*{\s*userId\s*}/g, 'WhatsAppSession.findOne({ where: { user_id: userId }');
  content = content.replace(/WhatsAppSession\.findAll\(\s*{\s*where:\s*{\s*userId\s*}/g, 'WhatsAppSession.findAll({ where: { user_id: userId }');
  content = content.replace(/WhatsAppSession\.count\(\s*{\s*where:\s*{\s*userId\s*}/g, 'WhatsAppSession.count({ where: { user_id: userId }');
  
  // 11. Corregir variables no definidas que vienen de parámetros con nombre diferente
  // Ejemplo: función(user_id) pero dentro usa userId
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Si es definición de función con user_id como parámetro
    if (line.match(/async \w+\(.*user_id:\s*number/)) {
      // Buscar hacia adelante las próximas líneas que usen userId sin declararlo
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('userId') && !lines[j].includes('user_id:') && !lines[j].includes('const userId')) {
          // Reemplazar userId por user_id en referencias
          lines[j] = lines[j].replace(/\buserId\b/g, 'user_id');
        }
        // Detener al final de la función (heurística simple)
        if (lines[j].trim().startsWith('} catch') || lines[j].trim() === '}') {
          break;
        }
      }
    }
  }
  content = lines.join('\n');
  
  modified = (content !== original);
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function fixControllerFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // En controllers, req.body usa camelCase (son DTOs)
  // Pero cuando creamos objetos para pasar a services, debemos usar el nombre correcto del DTO
  
  // SubscriptionController específico
  if (filePath.includes('SubscriptionController')) {
    content = content.replace(/user_id:\s*req\.user\.id/g, 'userId: req.user.id');
    content = content.replace(/subscription_id:\s*subscriptionId/g, 'subscriptionId: subscriptionId');
  }
  
  const modified = (content !== original);
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function fixTypesFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // FilterQuery debe tener userId, NO user_id (es un DTO)
  if (content.includes('export interface FilterQuery') && !content.includes('userId?:')) {
    content = content.replace(
      /(export interface FilterQuery \{[^}]*)/,
      '$1\n  userId?: number;'
    );
  }
  
  const modified = (content !== original);
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Aplicar fixes
let totalFixed = 0;

console.log('📁 Fixing Services...');
const services = [
  'AuthService.ts',
  'UserService.ts',
  'MessageService.ts',
  'WhatsAppSessionService.ts',
  'SubscriptionService.ts',
  'SendMessageJobService.ts',
  'UserPreferenceService.ts'
];

for (const service of services) {
  const filePath = path.join(__dirname, 'src', 'services', service);
  if (fixServiceFile(filePath)) {
    console.log(`  ✅ Fixed: ${service}`);
    totalFixed++;
  } else {
    console.log(`  ⏭️  Skipped: ${service} (no changes needed)`);
  }
}

console.log('\n📁 Fixing Controllers...');
const controllers = [
  'SubscriptionController.ts',
  'AuthController.ts',
  'UserController.ts',
  'MessageController.ts',
  'WhatsAppSessionController.ts',
  'SendMessageJobController.ts',
  'UserPreferenceController.ts'
];

for (const controller of controllers) {
  const filePath = path.join(__dirname, 'src', 'controllers', controller);
  if (fixControllerFile(filePath)) {
    console.log(`  ✅ Fixed: ${controller}`);
    totalFixed++;
  } else {
    console.log(`  ⏭️  Skipped: ${controller} (no changes needed)`);
  }
}

console.log('\n📁 Fixing Types...');
const typesFile = path.join(__dirname, 'src', 'types', 'index.ts');
if (fixTypesFile(typesFile)) {
  console.log('  ✅ Fixed: index.ts');
  totalFixed++;
} else {
  console.log('  ⏭️  Skipped: index.ts (no changes needed)');
}

console.log(`\n✨ Done! Fixed ${totalFixed} files.`);
console.log('\n🔍 Running build to check for remaining errors...\n');

