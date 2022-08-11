FROM thomasloven/hass-custom-devcontainer:latest

USER root
RUN git clone https://github.com/gwisp2/hass-the-token.git && \
    mkdir -p /config/custom_components && \
    cp -R hass-the-token/custom_components/the_token /config/custom_components/ && \
    rm -rf hass-the-token
