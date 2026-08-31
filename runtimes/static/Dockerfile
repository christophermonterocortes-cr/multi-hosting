FROM nginx:alpine

# Remove default nginx configurations
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set working directory for website files
WORKDIR /var/www/html

# Default starter page if directory is empty
COPY default-index.html /usr/share/nginx/default/index.html

# Expose HTTP port
EXPOSE 80

# Run nginx as unprivileged user where possible
CMD ["nginx", "-g", "daemon off;"]
