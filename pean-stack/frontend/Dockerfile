# Use the base image of Ubuntu 22.04
FROM ubuntu:22.04

# Set an environment variable to prevent interactive prompts
ARG DEBIAN_FRONTEND=noninteractive

# Update the package list and install Apache2
RUN apt-get update && apt-get install -y apache2

COPY ./index.html /var/www/html/index.html

# Expose port 80 for web traffic
EXPOSE 80

# Start Apache2 in the foreground as the main container process
CMD ["apachectl", "-D", "FOREGROUND"]