FROM quay.io/keycloak/keycloak:latest

COPY themes /opt/keycloak/themes
COPY realms /opt/keycloak/data/import

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]

CMD ["start-dev", 
"--http-port=8080", 
"--hostname-strict=false", 
"--spi-theme-cache-themes=false", 
"--spi-theme-cache-templates=false", 
"--import-realm"]