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
cd /srv/af2l/app
git pull
npm ci
npm run build
```

Creer ensuite un service systemd `/etc/systemd/system/af2l.service` :

```ini
[Unit]
Description=af2l SvelteKit app
After=network.target

[Service]
Type=simple
User=af2l
WorkingDirectory=/srv/af2l/app
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3001
EnvironmentFile=/etc/af2l/af2l.env
ExecStart=/usr/bin/node build
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Activer ou redemarrer le service :

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now af2l
sudo systemctl status af2l
```

Si Nginx sert le site public, il doit proxyfier vers `127.0.0.1:3001` :

```nginx
server {
	listen 80;
	server_name afleurdelignes.com www.afleurdelignes.com afleurdelignes.fr www.afleurdelignes.fr;
	return 301 https://afleurdelignes.com$request_uri;
}

server {
	listen 443 ssl http2;
	server_name www.afleurdelignes.com afleurdelignes.fr www.afleurdelignes.fr;
	# Conserver ici les lignes ssl_certificate / ssl_certificate_key existantes.
	return 301 https://afleurdelignes.com$request_uri;
}

server {
	listen 443 ssl http2;
	server_name afleurdelignes.com;
	# Conserver ici les lignes ssl_certificate / ssl_certificate_key existantes.

	location / {
		proxy_pass http://127.0.0.1:3001;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-Host $host;
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

### Erreur `Cross-site POST form submissions are forbidden`

Cette erreur vient du controle CSRF de SvelteKit. Le POST est refuse avant l'action
de login quand l'origine publique du navigateur ne correspond pas a l'origine connue
par le serveur Node.

Le domaine officiel est `afleurdelignes.com`. Les variantes `www.afleurdelignes.com`,
`afleurdelignes.fr` et `www.afleurdelignes.fr` doivent etre redirigees vers le domaine
canonique avant d'afficher l'admin. Le fichier `/etc/af2l/af2l.env` doit donc contenir :

```sh
ORIGIN=https://afleurdelignes.com
```

### Notifications email des depots de projet

Chaque depot de projet enregistre dans l'admin peut envoyer une notification a
`editions@afleurdelignes.com`. Configurer le SMTP dans `/etc/af2l/af2l.env` :

```sh
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@example.com
SMTP_PASSWORD=mot-de-passe-smtp
SMTP_FROM="A fleur de lignes <editions@afleurdelignes.com>"
PROJECT_SUBMISSION_NOTIFICATION_TO=editions@afleurdelignes.com
```

Si `SMTP_HOST` n'est pas defini, le depot reste enregistre dans l'admin mais aucun email
n'est envoye.

Apres modification du service :

```sh
sudo systemctl daemon-reload
sudo systemctl restart af2l
```

Verifier ensuite l'environnement reellement recu par le process Node :

```sh
PID=$(systemctl show -p MainPID --value af2l)
sudo tr '\0' '\n' < /proc/$PID/environ | grep -E '^(ORIGIN|HOST|PORT|PROTOCOL_HEADER|HOST_HEADER)='
```

Si `ORIGIN` est defini dans `/etc/af2l/af2l.env`, le service systemd doit contenir :

```ini
EnvironmentFile=/etc/af2l/af2l.env
```

Alternative possible derriere un proxy de confiance : laisser SvelteKit reconstruire
l'origine depuis les headers Nginx.

```ini
Environment=PROTOCOL_HEADER=x-forwarded-proto
Environment=HOST_HEADER=x-forwarded-host
```

Avec Nginx :

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
```

Ne pas desactiver le controle CSRF pour corriger cette erreur. La bonne correction est
d'aligner l'origine publique, systemd et les headers du proxy.

### Creer ou reinitialiser un compte admin en production

La commande doit etre lancee avec l'utilisateur applicatif `af2l`, depuis le repertoire
du site. Les commandes CLI ne chargent pas automatiquement le fichier systemd
`/etc/af2l/af2l.env`, il faut donc le sourcer explicitement avant `npm`.

Verifier d'abord que les migrations ont ete appliquees sur la base de production :

```sh
sudo -u af2l sh -lc 'set -a && . /etc/af2l/af2l.env && set +a && cd /srv/af2l/app && npm run db:migrate'
```

```sh
sudo -u af2l bash -lc 'set -a && . /etc/af2l/af2l.env && set +a && cd /srv/af2l/app && read -r -p "Email admin: " ADMIN_EMAIL && read -r -s -p "Mot de passe admin: " ADMIN_PASSWORD && printf "\n" && export ADMIN_EMAIL ADMIN_PASSWORD && npm run admin:create'
```

Utiliser l'utilisateur Linux `af2l` plutot que l'utilisateur PostgreSQL pour cette
operation : le script passe par la meme configuration applicative que le site et stocke
le mot de passe admin avec le hash attendu par l'application.

## Rappels utiles

- Ne pas utiliser `npm run dev` en production.
- `vite preview` sert seulement a previsualiser un build, pas a heberger durablement le site.
- `ORIGIN` doit correspondre exactement a l'origine publique du site, par exemple
  `https://afleurdelignes.com`. Sans cette variable, les formulaires POST peuvent echouer avec
  `Cross-site POST form submissions are forbidden` derriere Nginx.
- Si `build/` n'apparait pas, verifier que `svelte.config.js` importe bien `@sveltejs/adapter-node`.
- Si le port est deja occupe : `sudo lsof -i :3001`.
