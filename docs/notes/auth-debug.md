# Follow redirect test

$ curl -v -X POST http://localhost:3001/api/auth/login \
 -H "Origin: http://localhost:3000" \
 -H "Content-Type: application/json" \
 -d '{"email":"user1@example.com","password":"password123"}' \
 -L 2>&1 | head -20
Note: Unnecessary use of -X or --request, POST is already inferred.

- Host localhost:3001 was resolved.
- IPv6: ::1
- IPv4: 127.0.0.1
  % Total % Received % Xferd Average Speed Time Time Time Current
  Dload Upload Total Spent Left Speed
  0 0 0 0 0 0 0 0 --:--:-- --:--:-- --:--:-- 0\* Trying [::1]:3001...
- Connected to localhost (::1) port 3001
  > POST /api/auth/login HTTP/1.1
  > Host: localhost:3001
  > User-Agent: curl/8.7.1
  > Accept: _/_
  > Origin: http://localhost:3000
  > Content-Type: application/json
  > Content-Length: 54
  >
  > } [54 bytes data]
- upload completely sent off: 54 bytes
  < HTTP/1.1 302 Found
  < set-cookie: session=ed694d5f721513c479436aeb941afc8243fbdc9ca90870c9fa8fbb7621dbc276; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800
