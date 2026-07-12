FROM rust:1-bookworm AS builder

ARG SERVICE
WORKDIR /src

COPY rust/Cargo.toml rust/Cargo.lock ./
COPY rust/jagaAudio ./jagaAudio
COPY rust/yamnetService ./yamnetService
COPY rust/xgboostService ./xgboostService

RUN test "$SERVICE" = "yamnetService" || test "$SERVICE" = "xgboostService"
RUN cargo build --locked --release --package "$SERVICE"
RUN cp "/src/target/release/$SERVICE" /tmp/service

FROM debian:bookworm-slim AS runtime

ARG TARGETARCH
ARG ONNXRUNTIME_VERSION=1.22.0

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates wget \
    && case "$TARGETARCH" in \
         amd64) ORT_ARCH=x64 ;; \
         arm64) ORT_ARCH=aarch64 ;; \
         *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
       esac \
    && wget -qO /tmp/onnxruntime.tgz \
       "https://github.com/microsoft/onnxruntime/releases/download/v${ONNXRUNTIME_VERSION}/onnxruntime-linux-${ORT_ARCH}-${ONNXRUNTIME_VERSION}.tgz" \
    && tar -xzf /tmp/onnxruntime.tgz -C /tmp \
    && cp /tmp/onnxruntime-linux-*/lib/libonnxruntime.so* /usr/local/lib/ \
    && ldconfig \
    && rm -rf /var/lib/apt/lists/* /tmp/onnxruntime*

WORKDIR /app
COPY --from=builder /tmp/service /usr/local/bin/service
COPY models/yamnet ./models/yamnet
COPY models/xgboostAndDemoPreprocessor ./models/xgboostAndDemoPreprocessor
COPY models/wavlm ./models/wavlm

ENV ORT_DYLIB_PATH=/usr/local/lib/libonnxruntime.so
ENTRYPOINT ["/usr/local/bin/service"]
