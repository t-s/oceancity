const minDimension = Math.min(window.innerWidth, window.innerHeight);
const cellSize = minDimension / 12; 

const gridSize = 10;

const lineLength = cellSize * 0.6;
const lineThickness = cellSize * 0.06;

const dotSize = cellSize * 0.06;
const padding = cellSize * 0.1;

let avatarX;
let avatarY;
let lastRotationTime = 0;

const config = {
  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,

  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

function preload() {}

function create() {

  this.cameras.main.setBackgroundColor('#ffffff');

  const offsetX = (this.cameras.main.width - (gridSize * cellSize)) / 2;
  const offsetY = (this.cameras.main.height - (gridSize * cellSize)) / 2;

  this.lines = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = offsetX + i * cellSize;
      const y = offsetY + j * cellSize;

      const directions = ['N', 'E', 'S', 'W'];
      const direction = directions[Phaser.Math.Between(0, 3)];

      const color = new Phaser.Display.Color();
      color.random(1);

      let line1 = this.add.line(x, y, 0, 0, 0, 0, color.color).setLineWidth(lineThickness).setOrigin(0, 0.5);
      let line2 = this.add.line(x, y, 0, 0, 0, 0, color.color).setLineWidth(lineThickness).setOrigin(0, 0.5);

      switch (direction) {
        case 'N':
          line1.setTo(0, 0, 0, -lineLength);
          line2.setTo(0, 0, lineLength, 0);
          break;
        case 'E':
          line1.setTo(0, 0, lineLength, 0);
          line2.setTo(0, 0, 0, lineLength);
          break;
        case 'S':
          line1.setTo(0, 0, 0, lineLength);
          line2.setTo(0, 0, -lineLength, 0);
          break;
        case 'W':
          line1.setTo(0, 0, -lineLength, 0);
          line2.setTo(0, 0, 0, -lineLength);
          break;
      }

      this.lines.push(line1);
      this.lines.push(line2);

    }
  }

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = offsetX + i * cellSize;
      const y = offsetY + j * cellSize;
      this.add.circle(x, y, dotSize, 0x000000);
    }
  }

  avatarX = offsetX;
  avatarY = offsetY + (gridSize - 1) * cellSize;

  const avatarWidth = cellSize - 2 * padding;
  const avatarHeight = cellSize - 2 * padding;

  this.playerAvatar = this.add.rectangle(avatarX + padding, avatarY + padding,
                                         avatarWidth, avatarHeight, 
                                         0x000000);
  this.playerAvatar.setOrigin(0, 0);

  this.hoverRectangle = this.add.rectangle(0, 0, 
                                           cellSize, cellSize, 
                                           0xadd8e6, 0.3);
  this.hoverRectangle.setOrigin(0, 0);
  this.hoverRectangle.visible = false;

  this.input.on('pointermove', pointer => {
    const x = pointer.x - offsetX;
    const y = pointer.y - offsetY;
    const i = Math.floor(x / cellSize);
    const j = Math.floor(y / cellSize);
    if (i >= 0 && i < gridSize - 1 && j >= 0 && j < gridSize - 1) {
      this.hoverRectangle.x = offsetX + i * cellSize;
      this.hoverRectangle.y = offsetY + j * cellSize;
      this.hoverRectangle.visible = true;
    } else {
      this.hoverRectangle.visible = false;
    }
  });

  this.input.on('pointerdown', pointer => {
    const x = pointer.x - offsetX;
    const y = pointer.y - offsetY;
    const i = Math.floor(x / cellSize);
    const j = Math.floor(y / cellSize);
    
    // Calculate current position in grid coordinates (with rounding to avoid floating point issues)
    const currentI = Math.round((avatarX - offsetX) / cellSize);
    const currentJ = Math.round((avatarY - offsetY) / cellSize);
    
    // Check if the clicked position is adjacent to the current position
    const isAdjacent = (
      (Math.abs(i - currentI) === 1 && j === currentJ) || // Horizontal adjacent
      (Math.abs(j - currentJ) === 1 && i === currentI)    // Vertical adjacent
    );
    
    // Check if there's a line between the squares
    const hasNoLineBlocking = () => {
      if (!isAdjacent) return false;
      
      // Index in the lines array for the current position
      const currentIndex = currentJ * gridSize + currentI;
      const lineIndex = currentIndex * 2; // Each grid cell has 2 lines
      
      // Determine which edge we're trying to cross
      let direction;
      if (i > currentI) direction = 'E'; // Moving right
      else if (i < currentI) direction = 'W'; // Moving left
      else if (j > currentJ) direction = 'S'; // Moving down
      else if (j < currentJ) direction = 'N'; // Moving up
      
      // Check if the line at that edge is blocking the path
      // The lines are stored in pairs, with specific orientations based on the 'direction'
      const line1 = this.lines[lineIndex];
      const line2 = this.lines[lineIndex + 1];
      
      // Calculate the angle of the lines to check if they block the movement
      const line1Angle = (line1.angle + 360) % 360;
      const line2Angle = (line2.angle + 360) % 360;
      
      // Check if the lines block the movement based on their current angles
      switch (direction) {
        case 'N':
          return !((line1Angle === 0 || line1Angle === 180) || (line2Angle === 0 || line2Angle === 180));
        case 'E':
          return !((line1Angle === 90 || line1Angle === 270) || (line2Angle === 90 || line2Angle === 270));
        case 'S':
          return !((line1Angle === 0 || line1Angle === 180) || (line2Angle === 0 || line2Angle === 180));
        case 'W':
          return !((line1Angle === 90 || line1Angle === 270) || (line2Angle === 90 || line2Angle === 270));
        default:
          return false;
      }
    };
    
    // Add debugging
    console.log('Click at grid:', i, j);
    console.log('Current position:', currentI, currentJ);
    console.log('Avatar position:', avatarX, avatarY);
    console.log('Is adjacent:', isAdjacent);
    console.log('Bounds check:', i >= 0 && i < gridSize && j >= 0 && j < gridSize);
    console.log('No line blocking:', hasNoLineBlocking());
    
    if (i >= 0 && i < gridSize && j >= 0 && j < gridSize && isAdjacent && hasNoLineBlocking()) {
      avatarX = offsetX + i * cellSize;
      avatarY = offsetY + j * cellSize;
      console.log('Moving to:', avatarX, avatarY);
    }
  });
}

function update(time) {
  const elapsedTime = time - lastRotationTime;

  if (elapsedTime >= 1000) {
    this.lines.forEach(line => {
      line.angle += 90;
    });

    lastRotationTime = time;
  }

  this.playerAvatar.x = avatarX;
  this.playerAvatar.y = avatarY;
  
}
