# Work folder 035: SEWC Sophie player model

**Status:** active
**Triage type:** Small feature (type 7)
**Opened:** 2026-06-06

## Summary

Tim wants to be able to see the player character (Sophie) in the game. Sophie is a young girl with blonde hair and blue eyes, dressed in a blue dress and white shoes.

## Implementation

In a first-person Three.js game, "see yourself" most naturally means:
- Looking down, you can see your body (legs, dress, shoes)
- Optionally, your hands are visible at all times in the lower portion of the view

Build a simple low-poly Sophie model attached to the camera rig, visible in first-person:

- **Body**: slim box mesh, blue material (dress)
- **Legs**: two thin cylinder meshes below the dress, flesh-coloured
- **Shoes**: small white box meshes at the feet
- **Arms/hands**: two thin cylinder meshes extending forward from the sides of the view (visible at bottom-left and bottom-right), flesh-coloured with small white cuffs
- **Hair**: a rounded box or hemisphere above the "head" reference point, bright yellow/blonde material

The model group is parented to the camera. It should be offset so:
- The dress/body is visible in the lower-centre of the screen when looking straight ahead
- The feet/shoes are visible when looking down (~45° and below)
- The hands are visible at the sides of the lower screen

The model must NOT clip with the near frustum plane. Set the camera near plane to 0.05 if needed.

## Out of scope

- Full skeletal animation
- Facial features requiring textures
- Third-person camera

## Risk and rollback

Low-medium. New Three.js mesh group parented to camera. No gameplay logic changes. Rollback: revert the branch.

## Definition of done

- Looking down in any room, Sophie's blue dress, legs, and white shoes are visible
- Hands/arms are faintly visible at the lower sides of the screen
- Model does not clip through walls or create visual artefacts at the near frustum
- All existing tests pass
- Lint: 0 errors
- PR open on branch `feat/sewc-player-model`

## Pre-approved GitHub actions

- [x] Create a branch
- [x] Commit to a branch
- [x] Push a branch other than main
- [x] Open a pull request
- [x] Comment on a pull request or issue
- [x] Create an issue
