# Railway image for theglobalyouth.co.
# Apache serves the repo root and reads .htaccess, so clean URLs, 301s,
# 403 rules and the 404 page work exactly as on the old Awardspace host.
# PHP is included for save.php and the TRIDENT endpoint in DB/.
FROM php:8.3-apache

RUN a2enmod rewrite headers \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
 && echo 'ServerName localhost' > /etc/apache2/conf-enabled/servername.conf

COPY . /var/www/html/

# Railway sets PORT at runtime; Apache listens on it.
ENV PORT=8080
CMD sed -ri "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf \
 && sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf \
 && exec apache2-foreground
