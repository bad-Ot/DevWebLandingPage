# Dodge Racer — Jeu Canvas HTML5

---

## Sommaire

- [Caractéristiques](#caractéristiques)
- [Architecture](#architecture)
- [Bonnes Pratiques Implémentées](#bonnes-pratiques-implémentées)
- [Instructions de Jeu](#instructions-de-jeu)
- [Mécanique de Jeu](#mécanique-de-jeu)
- [Ressources](#ressources)
- [Notes Techniques](#notes-techniques)

---

## Caractéristiques

**Système de vies** : Le joueur commence avec 3 vies, perdues lors de collisions  
**6 niveaux** : Difficulté progressive avec augmentation de vitesse et spawn d'obstacles  
**Gestion d'états** : Menu, Gameplay, Game Over 
**Invulnérabilité temporaire** : 0.8s après le démarrage et après un hit  
**Hitbox améliorée** : Détection de collision basée sur l'intersection de zones  
**Architecture POO** : Classes Player, Obstacle, RoadRenderer, ObstacleSpawner, GameStateManager, GameManager  
**Événements centralisés** : Gestion unifiée des inputs (clavier)  
**Sauvegarde de scores** : Meilleur score stocké en localStorage par utilisateur  

---

## Architecture

### Structure par Classes

#### **GameManager** (Moteur Principal)
Gère la boucle de jeu, met à jour tous les systèmes, gère les états et les transitions.
- `constructor()` : Initialise canvas, contexte, tous les managers et entités
- `setupEventListeners()` : Centralise les écouteurs clavier
- `update(dt)` : Met à jour la logique selon state
- `updateGameplay(dt)` : Logique spécifique au gameplay
- `draw()` : Rendu de tous les éléments
- `loop()` : Boucle d'animation avec requestAnimationFrame

#### **Player**
Représente la voiture du joueur.
- `update(dt, canvasWidth, keys)` : Déplacement horizontal avec limitations
- `draw(ctx)` : Rendu avec ctx.save/restore et ctx.translate
- `getHitbox()` : Retourne une hitbox réduite pour collisions précises
- `takeDamage()` : Diminue les vies
- `isAlive()` : Vérifie si le joueur a des vies restantes

#### **Obstacle**
Représente un obstacle à éviter.
- `update(dt, speed, canvasHeight)` : Déplacement vertical
- `draw(ctx)` : Rendu avec ctx.save/restore et ctx.translate
- `getHitbox()` : Retourne sa hitbox avec padding
- `isOffScreen(canvasHeight)` : Détecte sortie d'écran

#### **RoadRenderer**
Gère l'affichage de la route/environnement.
- `update(dt, speed)` : Met à jour scroll de la route
- `draw(ctx)` : Rendu complet (asphalte, texture, bordures, lignes)
- `drawCenterLine()` : Ligne centrale en pointillés animée
- `drawVignette()` : Effet vignette

#### **ObstacleSpawner**
Gère la création et la gestion des obstacles.
- `update(dt, spawnDelay, level, canvasWidth)` : Logique de spawn
- `spawn(canvasWidth)` : Crée un nouvel obstacle
- `getObstacles()` : Retourne la liste
- `removeObstacle(index)` : Suprime un obstacle
- `clear()` : Réinitialise la liste

#### **GameStateManager**
Gère les états du jeu et les transitions.
- `setState(newState)` : Change d'état
- `getState()` : Retourne l'état actuel
- `isState(state)` : Vérifie si on est dans un état

---

## Bonnes Pratiques Implémentées

### 1. **Organisation POO**
- Classes bien définies avec responsabilités claires
- Encapsulation et cohésion

### 2. **Canvas Transforms (ctx.save/restore, ctx.translate)**
```javascript
// Exemple dans Player.draw()
ctx.save();
ctx.translate(this.x, this.y);
ctx.drawImage(this.image, 0, 0, this.width, this.height);
ctx.restore();
```
Tous les objets sont dessinés comme s'ils étaient à (0,0), puis repositionnés via translate().

### 3. **Animation avec requestAnimationFrame**
- Utilisé dans `GameManager.loop()` pour une boucle fluide
- Respect du timing système
- Pas de setInterval()

### 4. **Gestion d'États**
- `GameStateManager` centralise les transitions
- Logic conditionnelle basée sur `state`
- Extensible pour futurs états (HIGH_SCORES, PAUSE, etc.)

### 5. **Écouteurs Centralisés**
- `setupEventListeners()` dans GameManager
- Tous les inputs gérés au même endroit
- Évite la duplication et facilite le debugging

### 6. **Hitbox Améliorée**
```javascript
checkCollision(player, obstacle) {
  const playerHit = player.getHitbox();
  const obstacleHit = obstacle.getHitbox();
  
  // Calcul intersection + seuil
  const ix = Math.max(0, Math.min(...) - Math.max(...));
  const iy = Math.max(0, Math.min(...) - Math.max(...));
  
  return ix > CONFIG.HIT_THRESHOLD && iy > CONFIG.HIT_THRESHOLD;
}
```

### 7. **Gestion du Temps (dt)**
```javascript
const dt = Math.min(0.033, (now - this.lastTime) / 1000);
// Évite les sauts de frame
// Tous les mouvements sont scaled par dt pour framerate-independence
```

### 8. **Sauvegarde de Scores**
```javascript
saveBestScore(score) {
  const key = `scores_${user.email}`;
  const scores = JSON.parse(localStorage.getItem(key)) || {};
  scores.game1 = Math.max(scores.game1, score);
  localStorage.setItem(key, JSON.stringify(scores));
}
```

---

## Instructions de Jeu

### Contrôles
- **Flèche gauche** ou **A** : Déplacer à gauche
- **Flèche droite** ou **D** : Déplacer à droite
- **ESPACE** : Démarrer / Rejouer
- **Échap** : Retour au menu

### Objectif
Évite les obstacles qui descendent sur la route. Plus tu dures longtemps, plus le score augmente.

### Vies
- Tu commences avec 3 vies
- Chaque collision te coûte une vie
- Après être touché, tu as 0.8s d'invulnérabilité
- Quand les 3 vies sont perdues Game Over

### Niveaux
Ton score détermine ton niveau (1-6). Chaque niveau augmente la vitesse et la fréquence des obstacles.

### Fichiers Détails

**game1.html** : Canvas + HUD (Score, Vies, Meilleur) + Menu d'accueil  
**game1.css** : Styling minimal + animations (pulse menu)  
**game1.js** : POO avec 6 classes principales

---

## Mécanique de Jeu

### Progression des Niveaux

 Niveau  Vitesse  Spawn Delay Multi-Spawn % 
   1      220 px/s    1.05s        0%           
   2      260 px/s    0.95s        8%           
   3      310 px/s    0.85s        12%          
   4      380 px/s    0.75s        18%          
   5      460 px/s    0.65s        25%          
   6      560 px/s    0.55s        35%          

### Système de Spawn
- Spawn de base : toujours 1 obstacle par cycle
- Spawn multiple (selon niveau) : chance aléatoire
- À niveau 5+, chance de triple spawn rare
---

## Ressources

### Lectures Recommandées (du MOOC)
- *HTML5 Coding Essentials and Good Practices* - Chapitres sur Canvas
- Transformations géométriques : ctx.translate(), ctx.rotate(), ctx.save(), ctx.restore()
- Animation avec requestAnimationFrame()
- Gestion d'états dans les jeux

### Ressources Externes
- Image voiture : Générer par IA (Sora)
- Police : Google Fonts "Orbitron" (pondérations 400-900)

---

## Notes Techniques

### Extensibilité
- Facile d'ajouter l'état `HIGH_SCORES`
- Ajouter de nouveaux niveaux en modifiant `LEVELS`
- Ajouter des power-ups : créer classe `PowerUp`, ajouter logique dans `updateGameplay()`

### LocalStorage
- Stockage par email utilisateur (clé: `scores_${email}`)
- Valeur: JSON avec `{ game1, game2, game3 }`
- Persistant entre sessions

---

## Utilisation d'IA

Ce code a été généré/refactorisé avec assistance IA :
- **Outil** : GitHub Copilot (Claude Haiku 4.5)
- **Parties générées IA** :
  - Structure POO générale (classes) 
  - Logique de collision 
  - Gestion d'états 
  
- **Parties revues/corrigées manuellement** :
  - Intégration ctx.translate/save/restore 
  - Système de vies et invulnérabilité 
  - Gestion des niveaux (progression) 
  - Commentaires en français 

L'IA a fourni une base solide POO, mais le respect strict des bonnes pratiques du cours (transformations Canvas, gestion d'états, etc.) a été ajouté/validé manuellement.

---

## Pour Démarrer

1. Assure-toi que tu es connecté (localStorage currentUser)
2. Ouvre `index.html` dans un navigateur
3. Appuie sur ESPACE pour commencer

**Bon jeu !**
