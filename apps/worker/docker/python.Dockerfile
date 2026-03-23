FROM python:3.11-slim

RUN useradd -m -u 1000 runner && \
    mkdir /workspace && \
    chown -R runner:runner /workspace

USER runner
WORKDIR /workspace

COPY run.py /run.py
CMD ["python3", "/run.py"]
