# Re:Booth

A responsive e-photobooth based on the Frame, Capture, and Keep mockups. It takes three photos with a three-second countdown before each shot, shows a confirmation and shot count, and exports one PNG. The browser handles the camera, cropping, and download locally.

## Run in VS Code with Streamlit

Extract the ZIP and open the `reshoot` folder in VS Code. With Python 3.10 or newer, run these commands in the integrated terminal.

```sh
python -m pip install -r requirements.txt
python -m streamlit run streamlit_app.py
```

Open [http://localhost:8501](http://localhost:8501) on the computer running Streamlit. Choose a frame and select **Let’s take some photos**. The Capture screen requests camera access and shows the live feed as soon as you grant permission. Select **Start 3-photo session** when you’re ready. A plain HTTP address such as `http://192.168.1.6:8501` cannot access the camera. The color wheel opens your device’s color picker. The hex field accepts six digits with an optional #. Press Enter or leave the field to apply the color.

If your browser blocks camera access in the embedded Streamlit preview, run the standalone site in a second terminal and open [http://localhost:8000](http://localhost:8000).

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory public
```

Camera access requires browser permission and a secure context such as localhost or HTTPS. For phone camera testing, use the HTTPS Vercel URL. [Browser camera requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## Edit the site

| File | Contents |
| --- | --- |
| `public/index.html` | Screen structure and text |
| `public/styles.css` | Layout, colors, and responsive styling |
| `public/app.js` | Frame selection, camera countdown, and PNG export |
| `streamlit_app.py` | Local preview that reads the three frontend files |
| `vercel.json` | Build-free static deployment settings |

The frame picker includes Solid color, the ten designs from the submitted collection, Sample heart, and Hiyuki. The new designs replace the Gingham and Botanical placeholders. Photobomber masks the navy only inside the three photo windows, leaving its characters in front of the photos. The other supplied designs use their full artwork as a background, with three standard photo windows added on top.

The supplied logo is clipped to the round badge in the site header.

## Design custom frames

Create a **600 × 1280 px** portrait artboard and export a PNG with alpha transparency. Use `frame-template.png` as a starting layer. Coordinates are measured from the top-left of the full artboard.

| Photo window | X | Y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Top | 36 px | 36 px | 528 px | 336 px |
| Middle | 36 px | 402 px | 528 px | 336 px |
| Bottom | 36 px | 768 px | 528 px | 336 px |

This gives you 36 px side margins, 30 px gaps, and 176 px below the last photo. Keep the three windows transparent so the photos show through. Include any footer branding directly in your artwork. The app layers custom PNGs over the photos and center-crops each capture to fit its window.

Save exports in `public/frames/`. Use the filename listed in the corresponding entry of the `frames` array in `public/app.js`, followed by `.png`.

To use a full, opaque PNG such as a poster, add `behindPhotos: true` to its entry in the `frames` array in `public/app.js`. The artwork will appear in full in the frame picker, with the captured photos layered over it in the finished strip. To control exactly which areas of the artwork stay visible in the final strip, use a transparent overlay with the standard photo windows instead. After adding or replacing a PNG, rerun Streamlit, then refresh the preview. To rename a choice, edit its `name` in the `frames` array in `public/app.js`.

## Deploy to Vercel after local review

Push the extracted project to a Git repository and import it in Vercel. Select the directory containing `vercel.json` as the project root. The included configuration uses the **Other** preset, skips the build command, and serves `public`. The Streamlit wrapper is for local review. [Vercel static build settings](https://vercel.com/docs/builds/configure-a-build)
