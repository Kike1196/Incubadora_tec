FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# El flag --host es obligatorio; si no lo pones, Vite se encierra y no verás nada en localhost
CMD ["npm", "run", "dev", "--", "--host"]