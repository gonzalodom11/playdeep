# PlayDeep

PlayDeep es una aplicación web que permite a los usuarios subir y analizar videos de fútbol. Esta aplicación tiene un enfoque simple, fácil de usar y está construida con Django, Bootstrap 5 y Python.


## Tabla de Contenidos

1. [Características](#características)
2. [Tecnologías utilizadas](#tecnologías-utilizadas)
3. [Instalación](#instalación)
4. [Contribuciones](#contribuciones)

---
## Características

- **Subir videos**: Los usuarios pueden subir videos relacionados con partidos de fútbol o contenido similar.
- **Ver videos**: Los usuarios pueden ver los videos subidos.
- **Interfaz limpia y sencilla**: Utiliza Bootstrap 5 para un diseño responsive y moderno.
- **Gestión de videos**: Los videos subidos pueden ser procesados y organizados para facilitar la visualización.

## Tecnologías utilizadas

- **Backend**: Django 3.x
- **Frontend**: HTML, CSS, Bootstrap 5
- **Base de datos**: Postgresql
- **Python**: 3.x
- **Dependencias**:
  - `timm`
  - `torch`
  - `tldextract`
  - ... y otras dependencias incluidas en el requirements.txt
---

## Instalación

Para comenzar a trabajar con este proyecto localmente, sigue los siguientes pasos:

### Requisitos previos

1. **Python 3.x** debe estar instalado en tu máquina.
2. Tener **Git** instalado.

### Pasos para la instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu_usuario/playdeep.git
   cd playdeep
---
2. Crea un entorno virtual (opcional)
  ```
  PS C:\Users\User\> python -m venv venv
  ```
  Activar el entorno virtual:
    Windows
  ```
  venv\Scripts\activate
  ```
  Linux
  ```
  source venv/bin/activate
  ```
---

3. Instalar Django junto a las demás herramientas necesarias para el proyecto:
  ```
  pip install -r requirements.txt
  ```
4. Realiza las migraciones de la base de datos:
  ```
  python manage.py migrate
  ```
5. Ejecutar el servidor de desarrollo
  ```
  python manage.py runserver
  ```
6. Accede a tu navegador en la siguiente URL:
  ```
  http://127.0.0.1:8000/
  ```
---

## Contribuciones

¡Las contribuciones son bienvenidas! Si quieres mejorar la aplicación o corregir errores, sigue estos pasos:

1. Haz un fork del repositorio.

2. Crea una nueva rama:
  ```
  git checkout -b feature/nueva-caracteristica
  ```

3. Realiza los cambios necesarios y haz commit de tus cambios:
  ```
  git commit -m "feat: Añadí nueva característica"
  ```

4. Envía un pull request describiendo los cambios realizados.



  
   
   
