/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ItemId } from './types';

export class PlayerCharacterModel {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public head: THREE.Mesh;
  public helmetMesh: THREE.Mesh;
  public body: THREE.Mesh;
  public chestplateMesh: THREE.Mesh;
  public leftArm: THREE.Mesh;
  public rightArm: THREE.Mesh;
  public leftLeg: THREE.Mesh;
  public rightLeg: THREE.Mesh;
  public heldItemMesh: THREE.Mesh | null = null;
  public scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. Head Group (allows pitch rotation without tilting body)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc89870, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x00a8a8, roughness: 0.8 }); // Steve cyan shirt
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b387c, roughness: 0.8 }); // Steve blue jeans
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

    // Head cube (0.45 x 0.45 x 0.45)
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), skinMat);
    this.head.castShadow = true;
    this.head.receiveShadow = true;
    this.headGroup.add(this.head);

    // Hair cap
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), hairMat);
    hair.position.y = 0.16;
    this.headGroup.add(hair);

    // Eyes
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x224488 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), eyeWhiteMat);
    eyeL.position.set(-0.11, 0.02, -0.23);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), eyeWhiteMat);
    eyeR.position.set(0.11, 0.02, -0.23);
    const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.022), eyePupilMat);
    pupilL.position.set(-0.09, 0.02, -0.232);
    const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.022), eyePupilMat);
    pupilR.position.set(0.09, 0.02, -0.232);
    this.headGroup.add(eyeL, eyeR, pupilL, pupilR);

    // Helmet Overlay (hidden by default)
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.4, visible: false });
    this.helmetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), helmetMat);
    this.headGroup.add(this.helmetMesh);

    this.group.add(this.headGroup);

    // 2. Torso (0.44 x 0.65 x 0.24)
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.24), shirtMat);
    this.body.position.set(0, 0.95, 0);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);

    // Chestplate Overlay
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.4, visible: false });
    this.chestplateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.28), armorMat);
    this.chestplateMesh.position.set(0, 0.95, 0);
    this.group.add(this.chestplateMesh);

    // 3. Left Arm & Right Arm (pivot at shoulders Y = 1.25)
    const armGeom = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    armGeom.translate(0, -0.28, 0); // pivot at shoulder top

    this.leftArm = new THREE.Mesh(armGeom, skinMat);
    this.leftArm.position.set(-0.33, 1.25, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom.clone(), skinMat);
    this.rightArm.position.set(0.33, 1.25, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // 4. Left Leg & Right Leg (pivot at hip Y = 0.65)
    const legGeom = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    legGeom.translate(0, -0.32, 0); // pivot at hip top

    this.leftLeg = new THREE.Mesh(legGeom, pantsMat);
    this.leftLeg.position.set(-0.11, 0.65, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom.clone(), pantsMat);
    this.rightLeg.position.set(0.11, 0.65, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Default hidden until 3rd-person mode is active
    this.group.visible = false;
    this.scene.add(this.group);
  }

  public update(
    playerPos: THREE.Vector3,
    yaw: number,
    pitch: number,
    isMoving: boolean,
    isSprinting: boolean,
    isMining: boolean,
    heldItemId: ItemId | null,
    hasChestplate: boolean,
    hasHelmet: boolean,
    visible: boolean
  ) {
    this.group.visible = visible;
    if (!visible) return;

    this.group.position.copy(playerPos);
    this.group.rotation.y = yaw;

    // Head pitch
    this.headGroup.rotation.x = Math.max(-1.4, Math.min(1.4, pitch));

    // Armor overlays
    this.chestplateMesh.visible = hasChestplate;
    this.helmetMesh.visible = hasHelmet;

    // Arm and leg gait animations
    const now = Date.now() * 0.001;
    const speed = isSprinting ? 12 : 7.5;
    const swing = isMoving ? Math.sin(now * speed) * 0.6 : 0;

    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;

    if (isMining) {
      // Rapid mining swing on right arm
      this.rightArm.rotation.x = -Math.PI / 3 + Math.sin(now * 18) * 0.45;
      this.rightArm.rotation.z = -0.15;
    } else if (heldItemId) {
      // Held item pose
      this.rightArm.rotation.x = -Math.PI / 4 + (isMoving ? -swing * 0.4 : 0);
      this.rightArm.rotation.z = -0.1;
    } else {
      this.rightArm.rotation.x = -swing;
      this.rightArm.rotation.z = 0;
    }

    this.leftArm.rotation.x = swing;
  }

  public dispose() {
    this.scene.remove(this.group);
  }
}
