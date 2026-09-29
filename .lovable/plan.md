# Add the Central Florida Members Club page

## What will change

1. **Add a new page before “A global office without walls.”**
   - Present the Innovation Coffee Table as the exclusive meeting point for Central Florida members.
   - State that membership includes two coffees from Foxtail Coffee Co. at Belle Isle.
   - Include the existing Foxtail logo as a small supporting brand mark.
   - Use a premium editorial coffee-meeting visual consistent with the brochure, not the current marketing-banner artwork.

2. **Upgrade the Global Office page.**
   - Remove its existing skyline/image background.
   - Use the auto-rotating 3D world globe already designed for the brochure system, with visible global hub markers.
   - Keep the existing “A global office without walls” message and benefit cards readable over the globe.

3. **Update brochure flow.**
   - Coffee page becomes page 04, directly after Events.
   - Global Office moves to page 05.
   - Renumber the remaining pages and update the total from 9 to 10 everywhere in the brochure.

4. **Verify the finished brochure.**
   - Check `/membership` in desktop and mobile layouts.
   - Confirm the coffee page, Foxtail logo, page order, page counter, globe animation, and navigation all render correctly without overlap.

## Technical details

- Reuse the existing Foxtail logo asset and `SFHNetworkGlobe` component.
- Generate one dedicated coffee-meeting image for the new page and store it with the brochure assets.
- Keep changes limited to the Membership brochure and its required visual asset; no pricing or membership logic changes.
