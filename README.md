# afleurdelignes

Projet SvelteKit prevu pour un deploiement Node.js sur Ubuntu.

## Developpement

Installer les dependances puis lancer le serveur local :

```sh
npm install
npm run dev
```

## Build de production

```sh
npm run build
```

Le projet utilise `@sveltejs/adapter-node`, donc cette commande doit creer un repertoire `build/`.

Pour tester exactement le serveur Node genere :

```sh
npm run start
```

Par defaut, `npm run start` lance l'application sur `127.0.0.1:3001`.

## Deploiement Ubuntu sur le port 3001

Exemple de procedure sur le serveur :

```sh
cd /var/www/afleurdelignes
git pull
npm ci
npm run build
```

Creer ensuite un service systemd, par exemple `/etc/systemd/system/afleurdelignes.service` :

```ini
[Unit]
Description=afleurdelignes SvelteKit app
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/afleurdelignes
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3001
ExecStart=/usr/bin/node build
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Activer ou redemarrer le service :

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now afleurdelignes
sudo systemctl status afleurdelignes
```

Si Nginx sert le site public, il doit proxyfier vers `127.0.0.1:3001` :

```nginx
server {
	listen 80;
	server_name example.com;

	location / {
		proxy_pass http://127.0.0.1:3001;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
```

Puis :

```sh
sudo nginx -t
sudo systemctl reload nginx
```

## Rappels utiles

- Ne pas utiliser `npm run dev` en production.
- `vite preview` sert seulement a previsualiser un build, pas a heberger durablement le site.
- Si `build/` n'apparait pas, verifier que `svelte.config.js` importe bien `@sveltejs/adapter-node`.
- Si le port est deja occupe : `sudo lsof -i :3001`.
