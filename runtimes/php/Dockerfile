FROM php:8.2-fpm-alpine

# Install system dependencies, Nginx, and PHP extensions
RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    curl \
    oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pdo_mysql \
        mysqli \
        gd \
        mbstring \
        zip \
        opcache

# Configure Nginx & PHP
RUN rm -rf /etc/nginx/http.d/* /etc/nginx/conf.d/* && \
    mkdir -p /etc/nginx/http.d /run/nginx /var/log/nginx /var/www/html
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY php.ini /usr/local/etc/php/conf.d/custom.ini
COPY default-index.php /var/www/html/index.php

# Create entrypoint script to run both PHP-FPM and Nginx
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'php-fpm -D' >> /entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

WORKDIR /var/www/html

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
