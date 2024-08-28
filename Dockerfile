FROM postgres:13.2-alpine

RUN apk add --no-cache make gcc g++ clang llvm10 wget

RUN wget https://github.com/pgvector/pgvector/archive/refs/tags/v0.1.4.tar.gz \
    && tar -xzvf v0.1.4.tar.gz \
    && cd pgvector-0.1.4 \
    && make && make install

RUN apk del make gcc g++ clang llvm10

EXPOSE 5002
ENV PORT=5002
CMD node server.js