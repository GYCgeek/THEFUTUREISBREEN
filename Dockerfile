# Railway image for theglobalyouth.co.
# Apache serves the repo root and reads .htaccess, so clean URLs, 301s,
# 403 rules and the 404 page work exactly as on the old Awardspace host.
# PHP is included for save.php and the TRIDENT endpoint in DB/.
FROM php:8.3-apache

RUN a2enmod rewrite headers \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
 && echo 'ServerName localhost' > /etc/apache2/conf-enabled/servername.conf \
 && printf '%s\n' \
    '# Railway terminates HTTPS in front of Apache, so Apache builds its own redirects' \
    '# as http://host:PORT/... Strip that to a path so the browser keeps its URL.' \
    'Header always edit Location "^http://[^/]+:[0-9]+(/.*)$" "$1"' \
    > /etc/apache2/conf-enabled/railway-redirects.conf

COPY . /var/www/html/

# Railway sets PORT at runtime; Apache listens on it.
# mod_php needs mpm_prefork only; on Railway a second MPM can end up enabled
# ("AH00534: More than one MPM loaded"), so drop the others before starting.
ENV PORT=8080
CMD rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.* \
 && ln -sf ../mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load \
 && ln -sf ../mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf \
 && sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf \
 && sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf \
 && exec apache2-foreground
