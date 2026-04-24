FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install react-router-dom axios @tanstack/react-query

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
