"use strict";
// maintainer: Pavel Shaul, see more here: https://github.com/pavelerokhin

class Picrandomizer {
  constructor({
    containerId,
    imagesUrls,
    dontTouch = false,
    howManyImages = -1,
    repetition = false,
    resize = {
      needed: false,
      type: "cont",
      range: [-10, 10],
    },
    rotation = {
      needed: true,
      type: "cont",
      range: [0, 359],
    },
  }) {
    this.setParent(); // to all nested classes

    this.errors.errorState = false;

    // tests
    this.errors.containerExistsInDOM(containerId);
    this.errors.imagesUrlsIsNotEmpty(imagesUrls);
    this.errors.isItPossibleToPrintImagesWithNoRepetition(
      imagesUrls,
      howManyImages,
      repetition
    );
    this.errors.checkRotation(rotation);
    this.errors.checkResize(resize);

    if (this.errors.errorState) {
      this.errors.logErrorMessages();
      return;
    }

    // initialization
    this.config.set(
      containerId,
      imagesUrls,
      dontTouch,
      howManyImages,
      repetition,
      resize,
      rotation
    );
    this.container.dom = document.getElementById(containerId);
    this.container.size = this.container.getSize();

    this.images.howManyImages =
      this.config.howManyImages > 0
        ? this.config.imagesUrls.length
        : this.config.howManyImages;
    this.images.images = [];

    this.container.setStyle();

    if (this.config.repetition) {
      for (let i = 0; i < this.config.howManyImages; i++) {
        this.images.imagesUrls.push(
          this.config.imagesUrls[this.utils.rnd(this.config.imagesUrls.length)]
        );
      }
    } else {
      this.images.imagesUrls = this.utils
        .shuffleArray(this.config.imagesUrls)
        .slice(0, this.config.howManyImages);
    }

    this.images.createDomElements();
    this.images.preload();

    window.addEventListener("resize", () => {
      this.container.size = this.container.getSize();
      this.show();
    });
  }

  container = {
    parent: undefined,

    dom: undefined,
    size: {
      height: undefined,
      width: undefined,
    },
    getSize() {
      return {
        width: this.dom.offsetWidth,
        height: this.dom.offsetHeight,
      };
    },

    setStyle() {
      this.dom.style.cssText = `
      overflow: hidden;
    `;
    },
  };

  config = {
    containerId: undefined,
    imagesUrls: [],
    dontTouch: false,
    howManyImages: -1,
    repetition: false,
    resize: {
      needed: false,
    },
    rotation: {
      needed: true,
      type: "cont",
      range: [0, 345],
    },

    set(
      containerId,
      imagesUrls,
      dontTouch,
      howManyImages,
      repetition,
      resize,
      rotation
    ) {
      this.containerId = containerId.trim();
      this.imagesUrls = imagesUrls;
      this.dontTouch = dontTouch;
      this.howManyImages = howManyImages;
      this.repetition = repetition;
      this.resize = resize;
      this.rotation = rotation;

      if (this.resize && this.resize.range) {
        this.resize.range = this.resize.range.map((x) => (x += 100));
      }
    },
  };

  errors = {
    parent: undefined,
    errorState: false,
    errorMessages: [],
    typesAllowed: ["cont", "disc"],
    checkResize(resize) {
      if (resize.neened) {
        // check resize type
        if (!resize.type) {
          this.errorMessages.push(
            "resize is requested but the resize type hasn't been specified"
          );
          this.errorState = true;
          return;
        }

        if (this.typesAllowed.indexOf(resize.type) == -1) {
          this.errorMessages.push(
            `rotation type requested ${resize.type} is not allowed; allowed types are: ${this.typesAllowed}`
          );
          this.errorState = true;
        }

        // check resize range
        if (!resize.range) {
          this.errorMessages.push(`resize range hasn't been defined`);
          this.errorState = true;
          return;
        }

        if (resize.range.length > 2 && resize.type == "cont") {
          this.errorMessages.push(
            `if the resize type is continuous, only two limits has to be defined: min angle and max resize ratio in %`
          );
          this.errorState = true;
          return;
        }
      }
    },

    checkRotation(rotation) {
      if (rotation.neened) {
        // check rotation type
        if (!rotation.type) {
          this.errorMessages.push(
            "rotation is requested but the rotation type hasn't been specified"
          );
          this.errorState = true;
          return;
        }

        if (this.typesAllowed.indexOf(rotation.type) == -1) {
          this.errorMessages.push(
            `rotation type requested ${rotation.type} is not allowed; allowed types are: ${this.typesAllowed}`
          );
          this.errorState = true;
        }

        // check rotation range
        if (!rotation.range) {
          this.errorMessages.push(`rotation range hasn't been defined`);
          this.errorState = true;
          return;
        }

        if (rotation.range.length > 2 && rotation.type == "cont") {
          this.errorMessages.push(
            `if the rotation type is continuous, only two limits has to be defined: min angle and max angle in deg`
          );
          this.errorState = true;
          return;
        }
      }
    },

    containerExistsInDOM(containerId) {
      if (!containerId || !containerId.trim().length) {
        this.errorMessages.push("no Picrandomizer's container has been set");
        this.errorState = true;
      }

      return;
    },

    imagesUrlsIsNotEmpty(imagesUrls) {
      if (!imagesUrls || (imagesUrls && imagesUrls.length == 0)) {
        this.errorMessages.push("no Picrandomizer's images urls have been set");
        this.errorState = true;
      }

      return;
    },

    isItPossibleToPrintImagesWithNoRepetition(
      imagesUrls,
      howManyImages,
      repetition
    ) {
      if (!imagesUrls) {
        return;
      }

      let urlsN = imagesUrls.length;

      let imagesN = howManyImages >= 0 ? howManyImages : urlsN;

      if (imagesN > urlsN && !repetition) {
        this.errorMessages.push(
          `can't take ${imagesN} from the pictures provided (${urlsN} images) without repetition`
        );
        this.errorState = true;
      }

      return;
    },

    logErrorMessages() {
      if (this.errorState) {
        console.error("prirandomazer error:");
        this.errorMessages.forEach((e, i) => {
          console.error(`${i}: ${e}`);
        });
      }
    },
  };

  geometry = {
    isCollision(imgConfig1, imgConfig2) {
      if (!imgConfig1.projections || !imgConfig2.projections) {
        return false;
      }

      imgConfig1.projections.x.is_collide =
        (imgConfig1.projections.x.min.distance <= -imgConfig2.width / 2 &&
          imgConfig1.projections.x.max.distance >= -imgConfig2.width / 2) ||
        (imgConfig1.projections.x.min.distance <= imgConfig2.width / 2 &&
          imgConfig1.projections.x.max.distance >= imgConfig2.width / 2) ||
        (imgConfig1.projections.x.min.distance >= -imgConfig2.width / 2 &&
          imgConfig1.projections.x.max.distance <= imgConfig2.width / 2)
          ? true
          : false;

      imgConfig1.projections.y.is_collide =
        (imgConfig1.projections.y.min.distance <= -imgConfig2.height / 2 &&
          imgConfig1.projections.y.max.distance >= -imgConfig2.height / 2) ||
        (imgConfig1.projections.y.min.distance <= imgConfig2.height / 2 &&
          imgConfig1.projections.y.max.distance >= imgConfig2.height / 2) ||
        (imgConfig1.projections.y.min.distance >= -imgConfig2.height / 2 &&
          imgConfig1.projections.y.max.distance <= imgConfig2.height / 2)
          ? true
          : false;

      imgConfig2.projections.x.is_collide =
        (imgConfig2.projections.x.min.distance <= -imgConfig1.width / 2 &&
          imgConfig2.projections.x.max.distance >= -imgConfig1.width / 2) ||
        (imgConfig2.projections.x.min.distance <= imgConfig1.width / 2 &&
          imgConfig2.projections.x.max.distance >= imgConfig1.width / 2) ||
        (imgConfig2.projections.x.min.distance >= -imgConfig1.width / 2 &&
          imgConfig2.projections.x.max.distance <= imgConfig1.width / 2)
          ? true
          : false;

      imgConfig2.projections.y.is_collide =
        (imgConfig2.projections.y.min.distance <= -imgConfig1.height / 2 &&
          imgConfig2.projections.y.max.distance >= -imgConfig1.height / 2) ||
        (imgConfig2.projections.y.min.distance <= imgConfig1.height / 2 &&
          imgConfig2.projections.y.max.distance >= imgConfig1.height / 2) ||
        (imgConfig2.projections.y.min.distance >= -imgConfig1.height / 2 &&
          imgConfig2.projections.y.max.distance <= imgConfig1.height / 2)
          ? true
          : false;

      return imgConfig1.projections.x.is_collide &&
        imgConfig1.projections.y.is_collide &&
        imgConfig2.projections.x.is_collide &&
        imgConfig2.projections.y.is_collide
        ? true
        : false;
    },

    setProjections(imgConfig) {
      let center_x = imgConfig.center.x;
      let center_y = imgConfig.center.y;
      // TODO: controllare angle
      let angle = imgConfig.rotation ? imgConfig.rotation : 0;
      let corners = imgConfig.corners;

      // Genere start Min-Max projection on center of Square
      let projections = {
        x: {
          min: null,
          max: null,
          distance: null,
        },
        y: {
          min: null,
          max: null,
          distance: null,
        },
      };

      for (let corner of corners) {
        let projection_x = {},
          projection_y = {};

        /**
         * Global calculation for projection X and Y
         */

        // Angle 0:horizontale (center > left) 90:verticatale (center > top)
        let angle90 = -(angle % 90);

        //Distance :
        let distance_corner_center = Math.floor(
          Math.sqrt(
            (center_x - corner.x) * (center_x - corner.x) +
              (center_y - corner.y) * (center_y - corner.y)
          )
        );

        // Angle between segment [center-corner] and real axe X (not square axe), must be negative (radius are negative clockwise)
        let angle_with_axeX = -Math.floor(
          this.parent.utils.degrees(
            Math.atan((corner.y - center_y) / (corner.x - center_x))
          )
        ); // Tan(alpha) = opposé (ecart sur Y) / adjacent (ecart sur X)
        // If angle is ]0;90[, he is on the 2em et 4th quart of rotation
        if (angle_with_axeX > 0) {
          angle_with_axeX -= 180;
        }
        // If corner as upper (so with less pixel on y) thant center, he is on 3th or 4th quart of rotation
        if (
          corner.y < center_y ||
          (corner.y == center_y && corner.x < center_x)
        ) {
          angle_with_axeX -= 180;
        }

        // Calculate difference between 2 angles to know the angle between [center-corner] and Square axe X
        let delta_angle = angle_with_axeX - angle90;
        // If angle is on ]-180;-360], corner are upper than Square axe X, so set a positive angle on [0;180]
        if (delta_angle < -180) {
          delta_angle += 360;
        }

        /**
         * Projection on X
         */

        // Calculate distance between center and projection on axe X
        let distance_center_projection_x = Math.floor(
          distance_corner_center *
            Math.cos(this.parent.utils.radians(delta_angle))
        );

        // Create projection
        projection_x.x = Math.floor(
          center_x +
            distance_center_projection_x *
              Math.cos(this.parent.utils.radians(-angle90))
        );
        projection_x.y = Math.floor(
          center_y +
            distance_center_projection_x *
              Math.sin(this.parent.utils.radians(-angle90))
        );

        // If is the min ?
        if (
          projections.x.min == null ||
          distance_center_projection_x < projections.x.min.distance
        ) {
          projections.x.min = projection_x;
          projections.x.min.distance = distance_center_projection_x;
          projections.x.min.corner = corner;
        }
        // Is the max ?
        if (
          projections.x.max == null ||
          distance_center_projection_x > projections.x.max.distance
        ) {
          projections.x.max = projection_x;
          projections.x.max.distance = distance_center_projection_x;
          projections.x.max.corner = corner;
        }

        /**
         * Projection on Y
         */

        // Calculate distance between center and projection on axe Y
        let distance_center_projection_y = Math.floor(
          distance_corner_center *
            Math.cos(this.parent.utils.radians(delta_angle - 90))
        );

        // Create projection
        projection_y.x = Math.floor(
          center_x +
            distance_center_projection_y *
              Math.cos(this.parent.utils.radians(-angle90 - 90))
        );
        projection_y.y = Math.floor(
          center_y +
            distance_center_projection_y *
              Math.sin(this.parent.utils.radians(-angle90 - 90))
        );

        // If is the min ?
        if (
          projections.y.min == null ||
          distance_center_projection_y < projections.y.min.distance
        ) {
          projections.y.min = projection_y;
          projections.y.min.distance = distance_center_projection_y;
          projections.y.min.corner = corner;
        }
        // Is the max ?
        if (
          projections.y.max == null ||
          distance_center_projection_y > projections.y.max.distance
        ) {
          projections.y.max = projection_y;
          projections.y.max.distance = distance_center_projection_y;
          projections.y.max.corner = corner;
        }
      }

      imgConfig.projections = projections;
    },
  };

  images = {
    parent: undefined,

    howManyImages: 0,
    imagesUrls: [],
    images: [],

    createDomElements() {
      this.imagesUrls.forEach((url) => {
        let img = document.createElement("img");
        img.src = url;
        img.setAttribute("draggable", "false");

        this.images.push({
          imgItself: img,
          imgConfig: this.getConfigObject(),
        });
      });
    },

    getConfigObject() {
      return {
        center: { x: undefined, y: undefined },
        corners: [],
        height: undefined,
        isVisible: true,
        projections: undefined,
        radius: undefined,
        rotation: undefined,
        width: undefined,
      };
    },

    getRandomPosition(imgConfig) {
      let left = this.parent.utils.rnd(this.parent.container.size.width);
      let top = this.parent.utils.rnd(this.parent.container.size.height);
      return { centerX: left, centerY: top };
    },

    getRandomRotation(rotationConfig) {
      if (rotationConfig.type === "cont") {
        return this.parent.utils.rnd(rotationConfig.range);
      }

      return rotationConfig.range[
        this.parent.utils.rnd(rotationConfig.range.length)
      ];
    },

    getSize(img) {
      let resizeConfig = this.parent.config.resize;
      let resizeCoeffixient = 1;
      if (resizeConfig.needed) {
        if (resizeConfig.type == "cont") {
          resizeCoeffixient = this.parent.utils.rnd(resizeConfig.range) / 100;
        } else {
          resizeCoeffixient =
            resizeConfig.range[
              this.parent.utils.rnd(resizeConfig.range.length)
            ] / 100;
        }
      }

      return {
        height: Math.floor(img.height * resizeCoeffixient),
        width: Math.floor(img.width * resizeCoeffixient),
      };
    },

    preload() {
      for (let img of this.images) {
        const image = new Image();
        const preloadImage = (src) =>
          new Promise((r) => {
            image.onload = r;
            image.onerror = r;
            image.src = src;
          });

        // Preload an image
        preloadImage(img.imgItself.src);
        let imgSize = this.getSize(image);
        img.imgConfig.height = imgSize.height;
        img.imgConfig.width = imgSize.width;
      }
    },

    setStyle(img) {
      if (!img.imgConfig.isVisible) {
        return;
      }
      img.imgItself.style.cssText = `
      left: ${img.imgConfig.corners[0].x}px;
      position: absolute;
      top: ${img.imgConfig.corners[0].y}px;
      user-select: none;
      z-index: 0;`;

      if (this.parent.config.resize) {
        img.imgItself.style.height = `${img.imgConfig.height}px`;
        img.imgItself.style.width = `${img.imgConfig.width}px`;
      }

      if (this.parent.config.rotation) {
        img.imgItself.style.transform = `rotate(-${img.imgConfig.rotation}deg)`;
      }
    },

    setPosition(imgConfig, randomPosition) {
      imgConfig.center = {
        x: randomPosition.centerX,
        y: randomPosition.centerY,
      };

      let halfHeight = imgConfig.height / 2;
      let halfWidth = imgConfig.width / 2;

      imgConfig.corners = [];
      imgConfig.corners.push({
        x: imgConfig.center.x - halfWidth,
        y: imgConfig.center.y - halfHeight,
      });
      imgConfig.corners.push({
        x: imgConfig.center.x + halfWidth,
        y: imgConfig.center.y - halfHeight,
      });
      imgConfig.corners.push({
        x: imgConfig.center.x + halfWidth,
        y: imgConfig.center.y + halfHeight,
      });
      imgConfig.corners.push({
        x: imgConfig.center.x - halfWidth,
        y: imgConfig.center.y + halfHeight,
      });

      let rotationConfig = this.parent.config.rotation;
      if (rotationConfig && rotationConfig.needed) {
        imgConfig.rotation = this.getRandomRotation(rotationConfig);
      }
    },

    setPositionNotTouchingAnyone(imgConfig) {
      let attemptsCount = 0;
      let randomPosition = this.getRandomPosition(imgConfig);
      this.setPosition(imgConfig, randomPosition);

      // TODO: control this logic, looks not working
      while (this.touchesAnyone(imgConfig) && attemptsCount < 10) {
        this.parent.geometry.setProjections(imgConfig);

        let randomPosition = this.getRandomPosition(imgConfig);
        this.setPosition(imgConfig, randomPosition);
        this.parent.geometry.setProjections(imgConfig);
        attemptsCount++;
      }
      if (attemptsCount >= 10) {
        imgConfig.isVisible = false;
        imgConfig.corners = [];
        imgConfig.rotation = undefined;
      }
    },

    touchesAnyone(imgConfig) {
      let touch = false;
      for (let otherImg of this.images) {
        if (imgConfig == otherImg.imgConfig) {
          continue;
        }
        if (otherImg.imgConfig.corners.length > 0) {
          touch = this.geometry.isCollision(imgConfig, otherImg.imgConfig);
          if (touch) {
            break;
          }
        }
      }
      return touch;
    },
  };

  utils = {
    degrees(radians) {
      return (radians * 180) / Math.PI;
    },

    radians(degrees) {
      return (degrees * Math.PI) / 180;
    },

    // random number in scope: [0,a) if a is a number, otherwise [x1,x2), if a is an array [x1,x2]
    rnd(a) {
      if (typeof a === "number") {
        return Math.floor(Math.random() * a);
      }
      return Math.floor(Math.random() * (a[1] - a[0]) + a[0]);
    },

    shuffleArray(array) {
      let result = array.map((x) => x);
      for (let i = result.length - 1; i > 0; i--) {
        let j = this.rnd(i + 1);
        let temp = result[i];
        result[i] = result[j];
        result[j] = temp;
      }

      return result;
    },
  };

  setParent() {
    // pass the link to the parent instance
    this.container.parent = this;
    this.config.parent = this;
    this.errors.parent = this;
    this.images.parent = this;
    this.utils.parent = this;
  }

  show() {
    if (!this.errors.errorState) {
      for (let img of this.images.images) {
        if (!img.imgConfig.height || !img.imgConfig.width) {
          console.warn(
            `probably ${img.imgItself.src} has not been preloaded, it could spoil the randomization`
          );
        }

        if (this.config.dontTouch) {
          this.images.setPositionNotTouchingAnyone(img.imgConfig);
        } else {
          let randomPosition = this.images.getRandomPosition(img.imgConfig);
          this.images.setPosition(img.imgConfig, randomPosition);
        }
        if (img.imgConfig.isVisible) {
          this.images.setStyle(img);
          this.container.dom.appendChild(img.imgItself);
        }
      }
    } else {
      this.errors.logErrorMessages();
    }
  }
}
