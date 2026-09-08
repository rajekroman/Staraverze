import { test, expect } from "@playwright/test";
import { inflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BASELINES = {
  "visual-desktop:menu":[7,14,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,14,11,7,15,11,7,15,11,7,13,11,7,13,11,7,15,11,7,15,11,7,15,11,7,14,11,7,14,11,7,14,11,6,11,10,6,11,10,7,15,11,7,15,11,7,15,11,7,13,11,7,12,11,7,12,11,7,13,11,7,14,11,7,14,11,7,14,11,7,14,11,6,10,10,6,9,9,6,9,9,6,9,10,6,9,10,6,9,9,6,9,9,6,11,10,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11,7,14,11],
  "visual-iphone-portrait:menu":[3,0,6,3,0,6,3,0,6,3,0,6,3,0,6,3,0,6,3,0,6,3,0,6,6,9,9,6,11,10,6,11,10,6,11,10,6,11,10,6,11,10,6,11,10,6,10,9,6,12,10,6,9,9,6,9,9,6,10,10,7,12,11,7,14,11,7,15,11,7,14,11,7,12,10,6,12,10,7,12,11,6,12,10,7,12,11,7,13,11,7,13,11,7,13,10,6,11,10,6,10,9,6,10,10,6,11,10,6,11,10,6,10,10,6,10,9,6,11,10,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11,7,13,11],
  "visual-iphone-landscape:menu":[7,14,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,14,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,14,11,7,15,11,7,15,11,7,13,11,6,12,10,7,15,11,7,15,11,7,15,11,7,13,11,7,13,11,7,12,11,7,12,10,7,12,10,6,12,10,7,13,11,7,14,11,7,14,11,7,15,11,6,9,9,6,8,9,5,8,9,6,9,9,7,15,11,7,15,11,7,14,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11,7,15,11],
  "visual-desktop:chlum":[3,3,2,3,3,2,3,3,2,5,4,3,5,4,3,5,4,3,4,3,3,3,3,2,6,5,4,7,5,4,7,6,4,7,5,4,7,5,4,6,5,4,6,4,3,5,4,3,6,5,3,6,5,4,7,5,4,7,5,4,7,5,4,6,5,3,6,4,3,5,4,3,6,4,3,6,5,4,6,5,4,7,5,4,6,5,4,6,5,3,5,4,3,5,4,3,5,4,3,6,5,3,6,5,4,6,5,4,6,5,3,6,4,3,5,4,3,5,4,3,5,4,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,5,4,3,5,4,3],
  "visual-desktop:radar":[3,2,2,3,3,2,3,3,2,5,4,3,5,4,3,5,4,3,4,3,3,3,3,2,5,4,3,7,5,4,7,6,4,7,5,4,7,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,5,4,7,5,4,6,5,4,6,4,3,6,5,3,5,4,3,5,4,3,5,4,3,6,5,4,7,5,4,6,5,4,6,5,4,6,5,3,6,4,3,5,4,3,5,4,3,6,5,4,6,5,3,6,5,4,6,4,3,6,4,3,5,4,3,5,4,3,4,3,2,5,4,3,6,5,3,6,5,3,6,4,3,5,4,3,5,4,3,4,3,2],
  "visual-desktop:dig":[0,0,0,0,1,0,2,2,1,2,2,1,2,3,2,2,3,2,2,2,2,1,2,1,0,0,0,0,1,0,2,2,1,3,3,3,4,4,4,2,2,1,2,2,1,1,2,1,0,0,0,0,1,0,3,3,2,4,3,2,3,3,2,2,2,2,2,2,1,1,2,1,0,0,0,0,1,0,1,1,1,2,2,1,2,2,1,1,1,1,1,2,1,1,2,1,0,0,0,0,0,0,2,2,2,4,3,2,3,3,2,2,2,1,0,1,0,0,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
  "visual-iphone-portrait:chlum":[5,4,3,4,4,3,5,4,3,4,3,3,4,3,2,4,3,3,4,3,2,4,3,3,6,5,4,7,5,4,7,5,4,7,5,4,6,5,4,7,5,4,6,5,4,6,4,3,6,5,4,7,5,4,7,5,4,7,5,4,7,6,5,7,5,4,7,5,4,6,5,4,6,4,3,6,5,3,6,5,4,6,5,4,6,5,4,6,5,4,6,5,3,6,4,3,5,4,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,6,6,5,5,5,4],
  "visual-iphone-portrait:radar":[5,4,3,4,4,3,4,4,3,4,3,3,4,3,2,4,3,3,4,3,2,4,3,2,6,5,4,7,5,4,7,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,5,3,6,5,4,6,5,4,5,4,3,5,4,3,5,5,4,5,4,3,6,5,4,6,5,3,6,5,3,6,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,3,6,4,3,5,4,3,6,4,3,6,4,3,5,4,3,6,4,3,6,4,3,6,4,3,5,4,3,5,4,3,5,5,4,5,4,3,5,4,3,5,4,3,5,4,3,6,6,5,5,5,4],
  "visual-iphone-portrait:dig":[2,2,1,2,2,1,1,2,1,1,2,1,2,2,1,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2,2,3,2,3,3,3,3,3,3,3,3,2,2,2,1,2,2,1,2,2,1,3,3,2,3,3,2,3,3,2,3,2,2,3,3,2,2,2,2,1,2,1,1,1,1,2,2,1,2,2,1,2,3,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,4,3,2,4,3,2,4,4,3,4,4,3,3,3,2,3,3,2,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  "visual-iphone-landscape:chlum":[3,3,2,3,2,2,2,2,2,2,2,2,5,4,3,5,4,3,4,3,2,3,2,2,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,4,3,2,6,5,4,7,5,4,7,5,4,7,5,4,7,6,4,6,5,3,6,4,3,5,4,3,6,5,3,7,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,4,3,6,5,3,6,5,3,6,5,3,6,4,3,5,4,3,5,4,3,5,4,3,5,4,3,6,5,3,6,5,4,6,5,3,6,4,3,5,4,3,5,6,5],
  "visual-iphone-landscape:radar":[3,3,2,3,2,2,2,2,2,2,2,2,5,4,3,5,4,3,3,3,2,3,2,2,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,3,3,4,3,3,4,3,2,6,5,4,7,5,4,7,5,4,4,4,3,4,4,3,6,5,3,6,4,3,5,4,3,6,5,3,6,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,5,4,6,5,4,6,4,3,5,4,3,6,4,3,5,4,3,5,4,3,5,4,3,6,4,3,6,5,4,6,5,4,6,5,4,6,4,3,5,4,3,5,6,5],
  "visual-iphone-landscape:dig":[1,1,1,1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,1,1,2,1,1,1,0,2,2,2,3,3,2,3,3,2,3,3,2,3,3,2,2,2,2,1,2,1,1,1,0,2,2,2,4,3,2,4,3,3,4,3,2,4,3,2,3,2,2,2,2,1,1,1,0,1,2,1,1,2,1,3,3,2,3,3,2,1,1,1,1,1,1,1,2,1,1,1,0,2,2,1,2,2,1,2,2,2,1,1,1,1,1,1,1,1,1,1,2,1,0,0,0,1,1,1,2,2,1,2,2,2,2,2,2,2,2,1,1,1,1,0,1,0],
  "visual-desktop:malse-slavie":[7,7,7,9,9,8,5,5,5,6,6,6,9,9,9,9,10,9,9,9,9,8,8,8,7,7,6,9,9,9,6,6,6,6,6,6,11,11,10,11,11,10,10,10,9,8,8,8,7,7,7,9,9,9,6,6,6,6,6,6,10,10,10,10,10,9,9,9,9,8,8,8,7,7,6,9,9,9,6,6,6,6,6,6,10,10,10,10,11,10,10,10,9,7,8,7,7,7,6,9,9,9,5,6,6,6,6,6,8,8,8,7,8,7,7,7,7,7,7,7,7,7,6,9,9,8,5,5,5,5,5,5,8,8,7,7,7,7,7,7,7,6,6,6],
  "visual-desktop:chlum-tractor-front":[6,5,4,7,6,4,7,6,4,7,6,4,7,5,4,6,5,4,6,5,4,6,4,3,6,5,4,7,5,4,7,5,4,7,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,5,4,7,5,4,7,5,4,7,5,4,7,5,4,6,5,4,6,4,3,5,4,3,6,4,3,6,5,4,7,5,4,6,5,4,6,5,4,6,5,3,6,4,3,5,4,3,6,4,3,6,5,3,6,5,4,6,5,4,6,5,4,6,5,3,5,4,3,5,4,3,5,4,3,5,4,3,6,4,3,6,4,3,6,4,3,5,4,3,5,4,3,5,4,3],
  "visual-desktop:chlum-tractor-behind":[6,5,4,7,6,4,7,6,4,7,6,4,7,6,4,6,5,4,6,5,4,5,5,3,6,5,4,7,6,4,7,6,4,7,6,4,7,5,4,7,5,4,6,5,4,6,4,3,6,5,3,6,5,4,7,5,4,7,5,4,7,5,4,6,5,3,6,4,3,5,4,3,6,5,3,6,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,4,3,6,5,3,6,5,4,6,5,3,6,4,3,5,4,3,5,4,3,5,4,3,6,4,3,6,5,3,6,5,4,6,4,3,6,4,3,5,4,3,5,4,3],
  "visual-iphone-landscape:malse-slavie":[3,3,3,7,7,7,9,9,9,10,10,9,10,10,10,10,10,10,9,9,9,8,8,8,3,3,3,7,7,7,9,9,8,12,12,10,12,12,10,11,11,10,10,10,9,7,8,7,3,3,3,7,7,7,11,11,9,12,12,10,11,11,9,11,11,10,10,10,9,9,9,8,3,3,3,7,7,7,11,11,10,11,11,10,9,9,8,9,10,9,10,10,9,9,9,8,3,3,3,7,7,7,8,9,8,11,11,10,10,10,10,10,10,9,8,8,8,7,8,7,3,3,3,6,7,6,9,9,9,10,11,10,9,10,9,10,10,10,9,9,9,7,8,7],
  "visual-iphone-landscape:chlum-tractor-front":[6,5,4,7,5,4,7,5,4,7,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,5,4,7,6,4,7,6,4,7,5,4,6,5,4,6,5,4,6,4,3,5,4,3,6,5,3,6,5,4,7,5,4,7,5,4,7,5,4,6,4,3,5,4,3,5,4,3,6,5,3,6,5,4,7,5,4,6,5,4,6,5,4,6,5,3,6,4,3,5,4,3,6,4,3,6,4,3,6,5,3,6,5,3,6,5,3,6,4,3,5,4,3,5,4,3,5,4,3,6,4,3,6,5,3,6,5,4,6,5,3,6,4,3,5,4,3,5,4,3],
  "visual-iphone-landscape:chlum-tractor-behind":[6,5,4,7,6,4,7,6,4,7,5,4,6,5,4,6,5,4,6,5,3,5,4,3,6,5,3,7,5,4,7,5,4,7,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,5,4,7,5,4,7,5,4,7,6,5,7,6,4,6,5,4,6,4,3,5,4,3,6,4,3,6,5,4,6,5,4,7,5,4,6,5,4,6,4,3,5,4,3,5,4,3,6,4,3,6,5,4,6,5,4,6,4,3,6,4,3,6,5,3,6,4,3,5,4,3,5,4,3,6,4,3,6,5,3,6,5,3,6,5,3,6,4,3,5,4,3,5,4,3],
  "visual-iphone-portrait:malse-slavie":[8,8,8,9,9,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,8,10,10,9,10,10,9,11,11,9,10,10,9,10,10,9,10,10,9,10,10,9,10,10,9,10,11,10,11,11,10,10,11,10,10,10,10,10,10,9,10,10,9,10,11,10,10,10,9,8,9,8,8,8,7,8,9,8,8,9,8,8,9,8,9,9,8,9,9,9,8,8,8,7,7,7,7,8,7,7,8,7,6,7,6,7,7,6,7,7,7,7,7,7,7,7,7,7,7,6,7,7,7,7,7,7,5,6,5,6,7,6,7,7,7,6,6,5,6,6,6],
  "visual-iphone-portrait:chlum-tractor-front":[6,5,4,6,5,4,7,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,3,7,5,4,7,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,5,4,6,5,3,6,5,4,6,5,4,7,5,3,7,5,4,6,5,4,7,5,4,6,5,4,6,5,3,6,4,3,6,5,3,6,5,3,6,5,3,6,5,3,6,5,3,6,5,3,6,4,3,5,4,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3],
  "visual-iphone-portrait:chlum-tractor-behind":[7,6,4,7,6,5,7,6,5,7,6,4,6,6,4,6,6,4,6,6,4,6,5,4,7,5,4,7,6,4,7,6,4,7,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,5,4,6,5,4,7,5,4,7,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,3,6,5,4,6,4,3,6,4,3,6,4,3,6,5,4,6,5,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,6,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3,5,4,3],
  "visual-desktop:malse-slavie-behind":[7,7,7,9,9,8,5,5,5,6,6,6,9,9,9,9,10,9,9,9,9,8,8,8,7,7,6,9,9,9,6,6,6,6,6,6,11,11,10,11,11,10,10,10,9,8,8,8,7,7,7,9,9,9,6,6,6,6,6,6,11,10,10,10,10,10,9,9,9,8,8,8,7,7,6,9,9,9,6,6,6,5,6,6,9,9,9,10,11,10,10,10,9,7,8,7,7,7,6,9,9,9,5,6,6,6,6,6,8,8,8,8,8,8,7,7,7,7,7,7,7,7,6,9,9,8,5,5,5,5,5,5,8,8,7,7,7,7,6,7,6,7,7,6],
  "visual-desktop:malse-river":[3,5,6,4,7,7,5,7,8,8,8,7,10,10,9,7,7,7,5,5,5,8,8,8,3,5,6,4,7,7,5,8,8,7,8,7,11,10,10,7,8,7,5,6,6,9,9,8,3,5,6,4,7,8,5,8,8,8,9,7,11,11,10,8,8,8,5,6,6,9,9,8,3,5,6,4,7,8,5,8,8,7,8,7,11,11,10,8,8,7,5,5,5,8,8,8,3,5,6,4,6,7,5,7,7,7,8,7,10,10,10,7,7,7,5,5,5,7,7,7,3,5,6,4,7,7,5,7,7,7,8,6,10,10,9,7,7,7,4,5,5,6,6,6],
  "visual-iphone-portrait:malse-slavie-behind":[8,8,8,9,9,8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,8,10,10,9,11,10,9,11,11,10,11,10,9,10,10,9,10,10,9,10,10,9,10,10,9,10,11,10,11,11,10,10,11,10,10,10,10,10,10,10,10,10,10,10,11,10,10,10,9,8,9,8,9,9,8,8,8,8,9,9,9,9,9,9,9,9,9,9,9,9,8,8,8,7,7,7,7,7,7,7,7,7,6,7,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,6,6,6,6,6,7,6,7,7,7,6,7,6,6,6,6,7,7,6,7,7,6],
  "visual-iphone-portrait:malse-river":[4,7,8,4,8,8,6,7,6,5,7,5,5,6,5,8,8,8,9,9,8,9,9,8,4,8,8,5,8,9,6,7,7,5,7,5,5,6,4,9,9,9,10,10,9,9,9,9,4,8,9,5,9,10,6,7,7,5,7,5,5,7,5,10,10,9,10,10,10,10,10,9,5,7,8,5,8,9,6,7,7,5,7,5,4,6,4,9,9,9,10,10,9,10,10,9,4,7,8,4,8,9,6,7,7,4,6,4,4,6,4,8,9,8,9,8,8,9,9,8,4,7,8,4,7,8,5,6,6,4,6,4,3,5,3,8,8,7,8,8,8,8,8,8],
  "visual-iphone-landscape:malse-slavie-behind":[3,3,3,7,7,7,9,9,9,9,9,9,9,9,9,9,9,9,9,9,8,8,8,8,3,3,3,7,7,7,9,9,9,11,11,10,12,12,11,11,11,10,9,9,9,8,8,8,3,3,3,7,7,7,10,10,9,12,12,11,12,12,11,11,11,10,10,10,9,8,8,7,3,3,3,7,7,7,11,11,9,12,12,10,12,11,10,11,11,9,10,10,9,9,9,8,3,3,3,7,7,7,10,10,9,11,11,10,9,9,8,9,9,8,9,9,8,8,8,8,3,3,3,7,7,7,8,8,8,10,10,10,10,10,10,9,10,9,8,8,8,7,7,7],
  "visual-iphone-landscape:malse-river":[3,5,6,4,7,7,4,8,9,5,7,6,7,8,7,10,10,9,9,9,9,6,7,6,3,5,6,4,7,7,5,8,9,5,7,6,7,8,7,10,10,10,10,10,9,6,7,6,3,5,6,4,7,7,5,8,9,6,8,7,8,9,7,10,10,10,10,10,9,6,7,6,3,6,6,4,7,7,5,8,9,6,7,6,8,9,7,10,10,10,10,10,9,6,7,6,3,5,6,4,7,7,5,8,9,5,7,6,7,8,7,10,10,9,9,9,9,6,6,6,3,5,6,4,7,7,5,8,8,6,7,6,7,8,7,10,10,9,9,9,9,6,6,6],
  "visual-desktop:besednice-excavator-behind":[4,4,4,3,3,3,5,4,4,6,6,5,6,6,5,5,5,5,4,4,4,4,4,4,3,3,2,2,2,2,5,5,4,6,6,5,7,6,5,5,5,5,4,4,3,3,3,3,3,3,2,3,3,2,6,5,4,7,6,5,7,6,5,6,6,5,4,4,3,3,3,2,3,3,3,3,3,2,5,5,4,7,6,4,7,6,5,6,6,5,3,3,3,2,2,2,3,3,2,2,2,2,5,4,3,6,6,4,6,5,4,5,5,4,3,3,2,2,2,2,3,3,2,2,2,1,3,3,2,5,4,3,5,4,3,3,3,2,2,2,2,2,2,2],
  "visual-desktop:besednice-excavator-front":[4,4,3,3,3,3,4,4,4,6,5,5,6,6,5,5,5,4,4,4,4,4,4,4,3,3,3,2,2,2,5,4,3,6,6,5,6,6,5,5,5,4,3,4,3,3,3,3,3,3,2,3,2,2,5,5,4,7,6,5,7,6,5,6,6,5,4,4,3,3,3,3,3,3,2,3,2,2,6,5,4,7,6,5,7,6,5,6,6,5,3,3,3,2,3,2,3,3,3,2,2,2,5,4,3,6,6,4,5,4,3,5,5,4,3,3,2,2,2,2,3,3,3,2,2,2,3,3,2,5,4,3,5,4,3,3,3,2,2,2,2,2,2,2],
  "visual-iphone-landscape:besednice-excavator-behind":[4,4,4,5,5,4,6,5,4,6,5,4,6,6,5,7,6,6,6,6,5,4,4,4,4,3,3,5,4,4,6,5,4,6,6,4,6,6,5,6,6,5,6,6,5,3,4,3,4,3,3,5,4,3,6,6,4,8,7,6,8,8,6,7,6,5,6,6,5,4,4,3,4,4,3,5,4,3,6,5,4,8,7,5,7,6,5,7,6,4,6,5,4,3,3,3,4,4,3,4,4,3,6,5,4,6,5,4,6,5,4,5,5,4,4,4,3,3,3,3,4,4,4,5,5,4,6,5,5,7,6,5,7,6,5,6,6,5,5,5,4,4,4,3],
  "visual-iphone-landscape:besednice-excavator-front":[4,4,4,6,5,4,6,6,5,7,6,6,7,7,6,7,7,6,6,6,5,4,4,4,4,4,3,5,4,3,6,5,4,8,7,5,7,6,5,7,6,5,6,5,5,3,3,3,4,4,3,5,4,3,6,5,4,7,6,5,7,7,6,7,6,5,6,5,4,3,3,3,4,4,3,5,4,3,6,5,4,7,7,5,7,7,5,7,6,5,6,5,4,3,3,3,3,3,3,3,3,2,6,6,4,8,7,5,7,6,5,6,6,5,5,4,4,3,3,3,4,4,4,5,4,3,6,5,4,7,6,5,7,6,5,6,6,5,5,5,4,4,4,3],
  "visual-iphone-portrait:besednice-excavator-behind":[5,5,4,4,4,4,4,5,4,5,5,4,5,5,5,5,5,5,5,5,5,5,5,5,6,6,5,6,5,5,6,6,5,6,6,5,6,6,5,6,6,5,6,6,5,6,6,6,7,6,5,7,6,5,7,6,5,7,7,6,7,7,6,7,6,5,6,5,4,7,6,5,6,6,5,6,5,4,6,6,4,7,6,4,5,5,4,6,5,4,5,5,3,6,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,4,5,4,3,5,4,4,6,5,4,4,4,4,4,4,3,4,4,3,4,4,3,4,4,3,4,4,3,4,4,3,5,4,4],
  "visual-iphone-portrait:besednice-excavator-front":[5,5,4,4,4,4,5,5,4,5,5,5,5,5,5,5,5,5,5,5,5,5,6,5,6,5,4,5,5,4,5,5,4,6,6,5,6,6,5,5,5,4,6,5,5,6,6,6,6,5,4,6,5,4,6,6,4,7,7,5,6,6,5,6,6,4,7,6,5,7,6,5,6,6,5,6,5,4,6,5,4,7,6,5,7,6,5,7,6,5,6,6,5,7,6,5,6,5,4,5,4,3,5,4,3,5,4,3,5,5,4,6,5,4,5,4,3,6,5,4,5,4,4,4,4,3,4,4,3,4,4,3,5,4,3,5,4,3,4,4,3,5,5,4],
  "visual-desktop:malse-car-behind":[6,8,7,7,8,7,10,10,9,7,7,7,6,7,7,11,11,10,11,11,10,9,9,9,5,7,7,7,7,6,10,10,9,7,7,7,6,6,6,10,10,9,9,10,9,8,9,8,5,7,7,7,8,6,10,10,9,7,7,7,6,6,6,9,9,9,9,9,9,8,8,8,5,7,7,7,8,6,10,10,9,8,7,7,6,6,6,8,8,8,8,8,7,7,7,7,5,7,7,6,7,6,10,10,9,7,7,7,5,5,5,7,8,7,7,8,7,7,7,7,5,7,7,6,7,6,9,9,9,6,7,6,5,5,5,7,7,7,7,7,7,6,6,6],
  "visual-desktop:malse-car-front":[6,7,7,7,8,7,10,10,9,7,7,7,6,7,7,9,10,9,10,10,10,9,9,9,5,7,7,7,7,6,10,10,9,7,7,7,6,6,6,8,8,8,8,8,8,7,8,7,5,7,7,7,8,7,10,10,9,8,8,7,6,6,6,8,8,8,7,8,7,7,7,7,5,7,7,6,7,6,10,10,9,7,7,7,5,6,6,8,8,8,7,8,7,7,7,6,5,7,7,7,7,6,10,10,9,7,7,7,5,6,5,8,8,8,7,7,7,6,7,6,5,7,7,6,7,6,9,9,8,7,7,6,5,5,5,7,7,7,6,7,6,6,6,6],
  "visual-desktop:scale-reference":[7,6,5,4,5,4,4,5,4,4,5,4,4,5,4,4,5,4,4,5,4,7,6,5,6,5,5,9,7,6,9,7,6,7,6,4,7,6,4,7,6,4,7,6,4,6,5,4,6,5,5,8,7,5,7,6,5,7,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,5,6,5,4,6,5,4,6,4,3,6,5,4,5,6,4,6,5,3,6,5,4,6,5,5,6,5,4,6,4,3,5,4,3,6,4,3,5,5,3,6,5,3,6,5,4,6,5,5,6,5,3,6,5,3,6,5,3,6,5,3,6,4,3,6,4,3,6,5,4],
  "visual-iphone-landscape:malse-car-behind":[9,9,8,10,9,9,10,10,9,6,6,6,5,5,5,9,9,9,9,9,9,9,10,9,8,8,8,9,9,9,10,10,9,5,5,5,4,4,5,8,8,8,9,9,9,9,9,9,9,9,8,9,9,9,10,10,9,6,6,6,5,5,5,7,8,7,8,8,7,7,8,7,8,8,8,9,9,9,10,10,9,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,9,9,8,9,9,9,10,10,9,6,5,5,5,4,4,7,7,6,7,7,7,7,7,7,8,8,8,10,9,9,10,10,9,6,6,6,5,5,5,7,7,7,8,8,8,7,7,7],
  "visual-iphone-landscape:malse-car-front":[9,9,8,10,9,9,10,10,9,6,6,6,5,5,5,8,8,8,8,8,8,7,8,7,8,8,8,9,9,9,10,10,9,6,6,6,6,6,6,7,8,7,8,8,8,7,7,7,9,9,8,9,9,9,10,10,9,6,6,6,5,5,5,8,8,8,8,8,8,7,7,7,7,8,7,9,9,9,10,10,9,5,5,5,4,4,5,7,8,7,7,7,7,7,7,7,9,9,8,9,9,9,10,10,9,5,5,5,4,4,4,7,8,7,7,7,7,7,7,7,9,9,8,10,9,9,10,10,9,5,6,6,5,5,5,7,8,7,8,8,7,7,7,6],
  "visual-iphone-landscape:scale-reference":[7,6,5,6,5,4,5,5,4,4,5,4,4,5,4,4,5,4,6,5,4,6,5,5,6,5,5,7,6,5,10,8,7,7,6,4,7,6,4,7,6,4,6,5,4,6,5,4,6,5,5,7,6,4,7,6,5,6,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,5,6,5,4,6,5,4,6,4,3,6,5,4,4,6,4,6,5,4,6,5,4,6,5,5,6,5,4,6,4,4,6,4,3,6,5,3,5,5,3,6,5,4,6,5,4,7,6,5,7,5,4,7,5,4,7,5,4,7,6,4,7,5,4,7,5,4,6,5,5],
  "visual-iphone-portrait:malse-car-behind":[10,9,9,9,9,9,5,5,5,5,5,5,5,5,5,5,5,5,7,7,7,9,9,9,10,10,9,10,10,9,5,5,5,4,4,4,4,5,5,4,5,5,7,7,7,9,10,9,10,10,10,10,10,10,5,5,5,5,5,5,5,5,5,4,4,5,6,7,7,9,9,9,10,10,10,10,10,10,5,5,5,6,5,5,5,5,4,5,5,5,6,6,6,8,8,8,10,10,9,9,9,9,4,5,5,3,4,4,4,4,4,3,4,4,5,5,5,6,7,6,10,9,9,9,9,9,5,5,5,4,4,4,4,5,5,4,4,4,5,6,6,7,8,7],
  "visual-iphone-portrait:malse-car-front":[10,10,9,9,9,9,5,5,6,5,5,5,5,5,5,5,5,5,7,7,7,9,9,9,10,10,9,10,10,9,5,5,5,4,4,4,4,5,5,4,5,5,6,7,6,8,9,8,10,10,10,10,10,10,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,8,9,8,10,10,10,10,10,10,5,5,5,4,4,4,4,5,5,4,4,4,6,6,6,8,8,8,10,10,9,9,9,9,4,5,5,3,4,4,4,4,4,3,4,4,6,6,6,8,8,8,10,9,9,9,9,9,5,5,5,4,4,4,4,5,5,4,4,4,6,6,6,8,8,8],
  "visual-iphone-portrait:scale-reference":[6,7,5,6,6,5,6,6,4,6,5,4,6,5,4,6,6,4,6,6,5,6,7,5,7,6,5,6,5,4,8,7,5,9,8,6,9,8,6,8,7,6,7,5,4,7,6,5,7,6,5,6,5,4,7,5,4,6,5,4,6,5,4,6,5,4,6,5,4,7,6,5,7,5,4,6,5,4,5,5,4,6,5,4,6,4,3,6,4,3,6,5,3,7,6,4,7,5,4,4,6,4,4,6,3,6,5,3,6,5,3,7,5,3,6,5,3,7,6,4,7,6,5,6,5,4,6,5,4,6,5,4,6,5,4,6,5,4,6,5,4,7,6,5],
};

function decodePng(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error("Unexpected screenshot format");
  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset); offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString("ascii"); offset += 4;
    const data = buffer.subarray(offset, offset + length); offset += length + 4;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType)) throw new Error(`Unsupported PNG bitDepth=${bitDepth}, colorType=${colorType}`);
  const channels = colorType === 6 ? 4 : 3;
  const bpp = channels;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * channels);
  let src = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[src++];
    const row = raw.subarray(src, src + stride); src += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? out[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let value = row[x];
      if (filter === 1) value = (value + a) & 255;
      else if (filter === 2) value = (value + b) & 255;
      else if (filter === 3) value = (value + Math.floor((a + b) / 2)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        value = (value + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      out[x] = value;
    }
  }
  return { width, height, channels, pixels };
}

function fingerprint(buffer, cols = 8, rows = 6) {
  const { width, height, channels, pixels } = decodePng(buffer);
  const values = [];
  for (let gy = 0; gy < rows; gy += 1) {
    const y0 = Math.floor(gy * height / rows), y1 = Math.max(y0 + 1, Math.floor((gy + 1) * height / rows));
    for (let gx = 0; gx < cols; gx += 1) {
      const x0 = Math.floor(gx * width / cols), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * width / cols));
      let r = 0, g = 0, b = 0, count = 0;
      const stepX = Math.max(1, Math.floor((x1 - x0) / 12));
      const stepY = Math.max(1, Math.floor((y1 - y0) / 12));
      for (let y = y0; y < y1; y += stepY) {
        for (let x = x0; x < x1; x += stepX) {
          const i = (y * width + x) * channels;
          r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count += 1;
        }
      }
      values.push(Math.round(r / count / 17), Math.round(g / count / 17), Math.round(b / count / 17));
    }
  }
  return values;
}

function visualDistance(actual, expected) {
  if (!expected || actual.length !== expected.length) return Infinity;
  let total = 0;
  for (let i = 0; i < actual.length; i += 1) total += Math.abs(actual[i] - expected[i]);
  return total / actual.length;
}

async function openDebug(page) {
  await page.goto("/?debug=1", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => Boolean(window.__lovecDebug))).toBe(true);
}

async function capture(page, scene) {
  await page.waitForTimeout(120);
  const png = await page.screenshot({ fullPage: true, animations: "disabled" });
  mkdirSync("test-results/visual", { recursive: true });
  const project = test.info().project.name;
  writeFileSync(`test-results/visual/${project}-${scene}.png`, png);
  const fp = fingerprint(png);
  const key = `${project}:${scene}`;
  const expected = BASELINES[key];
  console.log(`VISUAL_BASELINE ${key}=${JSON.stringify(fp)}`);
  if (expected) expect(visualDistance(fp, expected), key).toBeLessThanOrEqual(1.25);
}

test("campaign menu visual baseline", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#titleScreen")).toHaveClass(/visible/);
  await expect(page.locator(".nzv-brand-lockup")).toBeVisible();
  await expect(page.locator("#campaignEventCard")).toBeVisible();
  await expect(page.locator("#playButton")).toBeVisible();
  await capture(page, "menu");
});

test("Chlum visual baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(930, 650);
  });
  await capture(page, "chlum");
});

test("Chlum tractor front occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(820, 650);
    window.__lovecDebug.setPatrolMotion("tractor", {
      x:820,y:600,speed:0,angle:0,working:true,resetMotion:true,collisionEnabled:false,
      points:[{x:820,y:600},{x:820,y:600}],index:1
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(120);
  await capture(page, "chlum-tractor-front");
});

test("Chlum tractor rear occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(820, 550);
    window.__lovecDebug.setPatrolMotion("tractor", {
      x:820,y:600,speed:0,angle:0,working:true,resetMotion:true,collisionEnabled:false,
      points:[{x:820,y:600},{x:820,y:600}],index:1
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(120);
  await capture(page, "chlum-tractor-behind");
});

test("Besednice excavator front occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.setPlayer(900, 660);
    window.__lovecDebug.setExcavatorState(0,{x:900,y:600,angle:0,turretAngle:.08,turretTarget:.08,workPhase:1.35,workSpeed:0,working:false,variant:0});
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(150);
  await capture(page, "besednice-excavator-front");
});

test("Besednice excavator rear occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(3);
    window.__lovecDebug.setPlayer(900, 535);
    window.__lovecDebug.setExcavatorState(0,{x:900,y:600,angle:0,turretAngle:.08,turretTarget:.08,workPhase:1.35,workSpeed:0,working:false,variant:0});
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(150);
  await capture(page, "besednice-excavator-behind");
});

test("Malše car front occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(970, 675);
    window.__lovecDebug.setPatrolMotion("car", {
      x:970,y:600,speed:0,angle:-Math.PI/2,resetMotion:true,collisionEnabled:false,
      points:[{x:970,y:600},{x:970,y:600}],index:1
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(120);
  await capture(page, "malse-car-front");
});

test("Malše car rear occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(970, 525);
    window.__lovecDebug.setPatrolMotion("car", {
      x:970,y:600,speed:0,angle:-Math.PI/2,resetMotion:true,collisionEnabled:false,
      points:[{x:970,y:600},{x:970,y:600}],index:1
    });
    window.__lovecDebug.snapCameraToPlayer();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(120);
  await capture(page, "malse-car-behind");
});

test("shared scale reference visual evidence", async ({ page }) => {
  await openDebug(page);
  const scene = await page.evaluate(() => {
    const result=window.__lovecDebug.startScaleReference();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
    return result;
  });
  expect(scene).toMatchObject({ level: "chlum", reference: true });
  await capture(page, "scale-reference");
});

test("Malše / Slávie identity baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(1450, 245);
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(700);
  await capture(page, "malse-slavie");
});

test("Malše / Slávie rear-occlusion evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(1450, 188);
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(700);
  await capture(page, "malse-slavie-behind");
});

test("Malše river embankment identity evidence", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(4);
    window.__lovecDebug.setPlayer(505, 310);
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("controls")?.classList.add("hidden");
  });
  await page.waitForTimeout(700);
  await capture(page, "malse-river");
});

test("radar reveal visual baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startLevel(0);
    window.__lovecDebug.setPlayer(500, 840);
    window.__lovecDebug.setScanCooldown(0);
    dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true }));
    dispatchEvent(new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true }));
    window.__lovecDebug.setScanPulse(.42);
  });
  await capture(page, "radar");
});

test("digging visual baseline", async ({ page }) => {
  await openDebug(page);
  await page.evaluate(() => {
    window.__lovecDebug.startDigChallenge(2);
    window.__lovecDebug.setDigSpeed(0);
    const state = window.__lovecDebug.digSnapshot();
    window.__lovecDebug.setDigMarker(state.zoneCenter);
    window.__lovecDebug.setDigTime(4);
  });
  await capture(page, "dig");
});
