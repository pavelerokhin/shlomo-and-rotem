let imagesUrls = [
  "/etc/flowers/1.png",
  "/etc/flowers/2.png",
  "/etc/flowers/3.png",
  "/etc/flowers/4.png",
  "/etc/flowers/6.png",
];

(() => {
  let bg = new Picrandomizer({
    containerId: "bg",
    imagesUrls: imagesUrls,
    howManyImages: 7,
    repetition: true,
    resize: {
      needed: true,
      type: "cont",
      range: [-30, -25],
    },
  });

  bg.show();
})();
