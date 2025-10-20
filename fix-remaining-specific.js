const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining specific issues...\n');

function fixFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  for (const [find, replace] of fixes) {
    if (typeof find === 'string') {
      content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
    } else {
      content = content.replace(find, replace);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// AuthService fixes
const authServiceFixes = [
  // Línea 282-283: UserRole operations
  ['where: { user_id }\\s*}\\);\\s*await UserRole\\.destroy\\(\\{\\s*where: { user_id: user_id, roleId }', 
   'where: { user_id }\\n      });\\n      await UserRole.destroy({\\n        where: { user_id: user_id, role_id: roleId }'],
  ['UserRole\\.create\\(\\{ user_id: user_id, roleId:', 'UserRole.create({ user_id: user_id, role_id: roleId'],
  // Línea 325: where roleId
  ['await UserRole\\.destroy\\(\\{\\s*where: { user_id }', 'await UserRole.destroy({ where: { user_id: user_id }'],
  // Logger.authEvent - segundo parámetro debe ser número, no objeto
  [/this\.logger\.authEvent\('logout', \{ user_id \}, true\)/g, 'this.logger.authEvent(\'logout\', user_id, true)'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'AuthService.ts'), authServiceFixes)) {
  console.log('✅ Fixed: AuthService.ts');
}

// SubscriptionController fix
const subscriptionControllerFixes = [
  ['user_id: req.user.id, subscription_id: subscriptionId', 'userId: req.user.id, subscriptionId: subscriptionId'],
];

if (fixFile(path.join(__dirname, 'src', 'controllers', 'SubscriptionController.ts'), subscriptionControllerFixes)) {
  console.log('✅ Fixed: SubscriptionController.ts');
}

// MessageService fixes - muchos userId no definidos
const messageServiceContent = fs.readFileSync(path.join(__dirname, 'src', 'services', 'MessageService.ts'), 'utf8');
const messageServiceLines = messageServiceContent.split('\n');

for (let i = 0; i < messageServiceLines.length; i++) {
  const line = messageServiceLines[i];
  
  // Buscar funciones con parámetro user_id
  if (line.match(/async \w+\(.*user_id:\s*number/)) {
    // Reemplazar userId por user_id en las siguientes líneas de la función
    let bracketCount = 0;
    let inFunction = false;
    
    for (let j = i; j < Math.min(i + 100, messageServiceLines.length); j++) {
      if (messageServiceLines[j].includes('{')) {
        bracketCount++;
        inFunction = true;
      }
      if (messageServiceLines[j].includes('}')) {
        bracketCount--;
        if (bracketCount === 0 && inFunction) break;
      }
      
      if (inFunction && j > i) {
        // Reemplazar userId que no esté en contexto de asignación
        messageServiceLines[j] = messageServiceLines[j].replace(/\buserId\b(?!:)/g, 'user_id');
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'src', 'services', 'MessageService.ts'), messageServiceLines.join('\n'), 'utf8');
console.log('✅ Fixed: MessageService.ts - userId references');

// MessageService - where clauses específicos
const messageServiceFixes2 = [
  ['where: { status_id:', 'where: { message_session_status_id:'],
  ['session.created_at', 'session.createdAt'],
  // Create message object
  ['{ remoteJid: any; whatsapp_session_id: any; status_id: number; sent_at: Date;', '{ remoteJid: any; whatsappSessionId: any; statusId: number; sentAt: Date;'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'MessageService.ts'), messageServiceFixes2)) {
  console.log('✅ Fixed: MessageService.ts - where clauses');
}

// SendMessageJobService fixes
const jobServiceFixes = [
  ['where: { status_id:', 'where: { send_messages_jobs_status_id:'],
  ['status_id:', 'send_messages_jobs_status_id:'],
  // Fix variables no definidas
  [/\bstatusId\b(?!:)/g, 'send_messages_jobs_status_id'],
  [/\buserId\b(?!:)/g, 'user_id'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'SendMessageJobService.ts'), jobServiceFixes)) {
  console.log('✅ Fixed: SendMessageJobService.ts');
}

// SubscriptionService fixes
const subscriptionServiceContent = fs.readFileSync(path.join(__dirname, 'src', 'services', 'SubscriptionService.ts'), 'utf8');
const subscriptionServiceLines = subscriptionServiceContent.split('\n');

for (let i = 0; i < subscriptionServiceLines.length; i++) {
  const line = subscriptionServiceLines[i];
  
  // Buscar funciones con parámetro user_id o subscription_id
  if (line.match(/async \w+\(.*user_id:\s*number/) || line.match(/async \w+\(.*subscription_id:\s*number/)) {
    let bracketCount = 0;
    let inFunction = false;
    
    for (let j = i; j < Math.min(i + 100, subscriptionServiceLines.length); j++) {
      if (subscriptionServiceLines[j].includes('{')) {
        bracketCount++;
        inFunction = true;
      }
      if (subscriptionServiceLines[j].includes('}')) {
        bracketCount--;
        if (bracketCount === 0 && inFunction) break;
      }
      
      if (inFunction && j > i) {
        subscriptionServiceLines[j] = subscriptionServiceLines[j].replace(/\buserId\b(?!:)/g, 'user_id');
        subscriptionServiceLines[j] = subscriptionServiceLines[j].replace(/\bsubscriptionId\b(?![:\(])/g, 'subscription_id');
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'src', 'services', 'SubscriptionService.ts'), subscriptionServiceLines.join('\n'), 'utf8');
console.log('✅ Fixed: SubscriptionService.ts - variable references');

// SubscriptionService - where clauses y otros
const subscriptionServiceFixes2 = [
  ['where: { status_id:', 'where: { subscription_status_id:'],
  ['status_id:', 'subscription_status_id:'],
  // SubscriptionFeature where clause
  ['where: { subscription_id:', 'where: { subscription_id: subscription_id'],
  // Create SubscriptionFeature
  ['slug, subscription_id, value', 'slug, subscription_id: subscription_id, value'],
  // Update objects - mapear camelCase a snake_case
  ['await userSubscription.update(subscriptionData)', 'await userSubscription.update({ subscription_id: subscriptionData.subscriptionId, status_id: subscriptionData.statusId })'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'SubscriptionService.ts'), subscriptionServiceFixes2)) {
  console.log('✅ Fixed: SubscriptionService.ts - where clauses');
}

// UserPreferenceService fixes
const userPrefServiceContent = fs.readFileSync(path.join(__dirname, 'src', 'services', 'UserPreferenceService.ts'), 'utf8');
const userPrefServiceLines = userPrefServiceContent.split('\n');

for (let i = 0; i < userPrefServiceLines.length; i++) {
  const line = userPrefServiceLines[i];
  
  if (line.match(/async \w+\(.*user_id:\s*number/) || line.match(/async \w+\(.*system_preference_id:\s*number/)) {
    let bracketCount = 0;
    let inFunction = false;
    
    for (let j = i; j < Math.min(i + 100, userPrefServiceLines.length); j++) {
      if (userPrefServiceLines[j].includes('{')) {
        bracketCount++;
        inFunction = true;
      }
      if (userPrefServiceLines[j].includes('}')) {
        bracketCount--;
        if (bracketCount === 0 && inFunction) break;
      }
      
      if (inFunction && j > i) {
        userPrefServiceLines[j] = userPrefServiceLines[j].replace(/\buserId\b(?!:)/g, 'user_id');
        userPrefServiceLines[j] = userPrefServiceLines[j].replace(/\bsystemPreferenceId\b(?!:)/g, 'system_preference_id');
        userPrefServiceLines[j] = userPrefServiceLines[j].replace(/\buserPreferenceId\b(?!:)/g, 'user_preference_id');
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'src', 'services', 'UserPreferenceService.ts'), userPrefServiceLines.join('\n'), 'utf8');
console.log('✅ Fixed: UserPreferenceService.ts - variable references');

// UserPreferenceService - where clauses
const userPrefServiceFixes2 = [
  ['where: { system_preference_id:', 'where: { system_preference_id: system_preference_id'],
  ['where: { user_preference_id:', 'where: { user_preferences_id: user_preference_id'],
  // DTOs access
  ['optionData.user_preferences_id', 'optionData.userPreferenceId'],
  // Update
  ['await preference.update(preferenceData)', 'await preference.update({ system_preference_id: preferenceData.systemPreferenceId, status_id: preferenceData.statusId })'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'UserPreferenceService.ts'), userPrefServiceFixes2)) {
  console.log('✅ Fixed: UserPreferenceService.ts - where clauses');
}

// UserService fixes
const userServiceContent = fs.readFileSync(path.join(__dirname, 'src', 'services', 'UserService.ts'), 'utf8');
const userServiceLines = userServiceContent.split('\n');

for (let i = 0; i < userServiceLines.length; i++) {
  const line = userServiceLines[i];
  
  if (line.match(/async \w+\(.*user_id:\s*number/) || line.match(/async \w+\(.*role_id:\s*number/)) {
    let bracketCount = 0;
    let inFunction = false;
    
    for (let j = i; j < Math.min(i + 100, userServiceLines.length); j++) {
      if (userServiceLines[j].includes('{')) {
        bracketCount++;
        inFunction = true;
      }
      if (userServiceLines[j].includes('}')) {
        bracketCount--;
        if (bracketCount === 0 && inFunction) break;
      }
      
      if (inFunction && j > i) {
        userServiceLines[j] = userServiceLines[j].replace(/\buserId\b(?!:)/g, 'user_id');
        userServiceLines[j] = userServiceLines[j].replace(/\broleId\b(?![:\(])/g, 'role_id');
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'src', 'services', 'UserService.ts'), userServiceLines.join('\n'), 'utf8');
console.log('✅ Fixed: UserService.ts - variable references');

// UserService - where clauses
const userServiceFixes2 = [
  ['where: { user_id, role_id:', 'where: { user_id: user_id, role_id: role_id'],
  ['UserRole.create({ user_id, role_id:', 'UserRole.create({ user_id: user_id, role_id: role_id'],
  ['where: { user_id, role_id }', 'where: { user_id: user_id, role_id: role_id }'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'UserService.ts'), userServiceFixes2)) {
  console.log('✅ Fixed: UserService.ts - where clauses');
}

// WhatsAppSessionService fixes
const whatsappServiceContent = fs.readFileSync(path.join(__dirname, 'src', 'services', 'WhatsAppSessionService.ts'), 'utf8');
const whatsappServiceLines = whatsappServiceContent.split('\n');

for (let i = 0; i < whatsappServiceLines.length; i++) {
  const line = whatsappServiceLines[i];
  
  if (line.match(/async \w+\(.*user_id:\s*number/) || line.match(/async \w+\(.*phone_number:\s*string/)) {
    let bracketCount = 0;
    let inFunction = false;
    
    for (let j = i; j < Math.min(i + 100, whatsappServiceLines.length); j++) {
      if (whatsappServiceLines[j].includes('{')) {
        bracketCount++;
        inFunction = true;
      }
      if (whatsappServiceLines[j].includes('}')) {
        bracketCount--;
        if (bracketCount === 0 && inFunction) break;
      }
      
      if (inFunction && j > i) {
        whatsappServiceLines[j] = whatsappServiceLines[j].replace(/\buserId\b(?!:)/g, 'user_id');
        whatsappServiceLines[j] = whatsappServiceLines[j].replace(/\bphoneNumber\b(?!:)/g, 'phone_number');
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'src', 'services', 'WhatsAppSessionService.ts'), whatsappServiceLines.join('\n'), 'utf8');
console.log('✅ Fixed: WhatsAppSessionService.ts - variable references');

// WhatsAppSessionService - otros fixes
const whatsappServiceFixes2 = [
  ['session.created_at', 'session.createdAt'],
  ['session.updated_at', 'session.updatedAt'],
  // Update
  ['await session.update(sessionData)', 'await session.update({ phone_number: sessionData.phoneNumber, status_id: sessionData.statusId, account_protection: sessionData.accountProtection, log_messages: sessionData.logMessages, webhook_url: sessionData.webhookUrl, webhook_enabled: sessionData.webhookEnabled, browser_context_id: sessionData.browserContextId })'],
];

if (fixFile(path.join(__dirname, 'src', 'services', 'WhatsAppSessionService.ts'), whatsappServiceFixes2)) {
  console.log('✅ Fixed: WhatsAppSessionService.ts - property access');
}

console.log('\n✨ All specific fixes applied!');
console.log('Run "npm run build" to check results.');

