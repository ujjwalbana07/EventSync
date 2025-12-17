FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Copy static assets to standalone folder because Next.js doesn't do it automatically
RUN cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
CMD ["node", ".next/standalone/server.js"]
