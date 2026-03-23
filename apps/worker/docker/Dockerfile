FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    python3=3.10.12-1ubuntu2 \
    python3-pip=22.0.2+dfsg-1ubuntu0.5 \
    gcc=4:11.4.0-1ubuntu1 \
    g++=4:4:11.4.0-1ubuntu1 \
    openjdk-17-jre-headless=17.0.12-0ubuntu1 \
    nodejs=18.19.0+dfsg-1ubuntu2 \
    npm=8.19.0+dfsg-1ubuntu2 \
    golang-go=2:1.21~ubuntu1 \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 runner

RUN mkdir /workspace && chown -R runner:runner /workspace

WORKDIR /workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER runner

ENTRYPOINT ["/entrypoint.sh"]
