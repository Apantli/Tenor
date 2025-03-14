FROM ubuntu:22.04

ARG FIREBASE_VERSION=13.3.0

# Configurar variables de entorno para evitar prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Actualizar sistema e instalar dependencias esenciales
RUN apt update && apt install -y \
    default-jre \
    bash \
    curl \
    openssl \
    gettext \
    nano \
    nginx \
    sudo \
    software-properties-common \
    gnupg \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Agregar repositorio para Python 3.12 e instalarlo con venv y pip
RUN add-apt-repository ppa:deadsnakes/ppa -y && apt update && \
    apt install -y python3.12 python3.12-venv python3.12-dev python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Instalar Node.js y npm (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Instalar Firebase CLI globalmente
RUN npm i -g firebase-tools@$FIREBASE_VERSION

# Definir directorio de trabajo
WORKDIR /srv/firebase

# Copiar archivos de configuración de Firebase
COPY firebase.json .
COPY .firebaserc .
COPY storage.rules .
COPY firestore.indexes.json .

# Copiar código de funciones y script de inicio
COPY ./functions ./functions
COPY firebase_docker/serve.sh /usr/bin/
COPY functions/requirements.txt .

RUN mkdir -p /srv/firebase/functions

WORKDIR /functions
RUN python3.12 -m venv venv
WORKDIR /
RUN . functions/venv/bin/activate && pip install -r /requirements.txt

# Dar permisos de ejecución al script
RUN chmod +x /usr/bin/serve.sh
EXPOSE  4400 4500 5000 5001 8001 8080 8085 9000 9099

# Definir punto de entrada
ENTRYPOINT ["/usr/bin/serve.sh"]
