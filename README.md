### env file

PORT=
DB_HOST=''
DB_USER=''
DB_PASS=''
DB_DATABASE=''

### .htaccess file
```
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
DirectoryIndex disabled
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:4000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^/(.*)$ http://127.0.0.1:4000/$1 [P,L]

PassengerAppRoot "/home/purrfect/backend"
PassengerBaseURI "/"
PassengerNodejs "/home/purrfect/nodevenv/backend/16/bin/node"
PassengerAppType node
PassengerStartupFile dist/index.js
PassengerAppLogFile "/home/purrfect/logs/backend_passenger.log"
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```