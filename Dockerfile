# Railway image for theglobalyouth.co.
# Apache serves the repo root and reads .htaccess, so clean URLs, 301s,
# 403 rules and the 404 page work exactly as on the old Awardspace host.
# PHP is included for save.php and the TRIDENT endpoint in DB/.
FROM php:8.3-apache

# Railway terminates HTTPS in front of Apache. Declare the public scheme and
# port inside the vhost (a vhost otherwise takes them from its own
# <VirtualHost *:PORT>), so redirects go to https://<visitor host>/... and not
# http://...:PORT/...; UseCanonicalName Off keeps the host from the request.
RUN a2enmod rewrite headers \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
 && echo 'ServerName localhost' > /etc/apache2/conf-enabled/servername.conf \
 && printf '%s\n' \
    '# Let browsers keep static files instead of re-checking them on every visit.' \
    '# File names are not versioned, so CSS and JS get one day; pages are not cached.' \
    '<FilesMatch "\.(jpe?g|png|gif|webp|svg|ico|cur|woff2?|ttf|otf|eot|pdf|mp4)$">' \
    '  Header set Cache-Control "public, max-age=2592000"' \
    '</FilesMatch>' \
    '<FilesMatch "\.(css|js)$">' \
    '  Header set Cache-Control "public, max-age=86400"' \
    '</FilesMatch>' \
    > /etc/apache2/conf-enabled/cache.conf \
 && sed -i -e '/<VirtualHost/a ServerName https://localhost:443' \
           -e '/<VirtualHost/a UseCanonicalName Off' \
           /etc/apache2/sites-available/000-default.conf

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
