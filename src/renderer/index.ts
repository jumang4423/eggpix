import p5 from "p5";
import { audioStore } from "@/global";
import { SetupAudio } from "@/lib/audio";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TOOL_AREA_WIDTH = 150;
const DRAWING_AREA_WIDTH = CANVAS_WIDTH - TOOL_AREA_WIDTH;

// Normalize position between 0 and 1
function normalizePos(x: number, y: number) {
  // Normalize x and y to 0-1 range with bounds checking
  const normalizedX = Math.max(0, Math.min(1, x / DRAWING_AREA_WIDTH));
  const normalizedY = Math.max(0, Math.min(1, y / CANVAS_HEIGHT));

  return {
    x: normalizedX,
    y: normalizedY,
  };
}

class Sketch {
  private p: p5;
  private canvas!: p5.Renderer;
  private drawingBuffer!: p5.Graphics;
  private clearButton!: p5.Element;
  private colorToggleButton!: p5.Element;
  private hue: number = 0;
  private isRainbowMode: boolean = false;
  private isAudioInitialized: boolean = false;
  private pos: number = 0;
  private pitch: number = 0;

  constructor(p: p5) {
    this.p = p;
    this.p.setup = this.setupCanvas.bind(this);
    this.p.draw = this.draw.bind(this);
    this.p.windowResized = this.handleWindowResize.bind(this);
    this.p.mousePressed = this.handleMousePressed.bind(this);
    this.p.mouseReleased = this.handleMouseReleased.bind(this);
  }

  async handleMousePressed() {
    if (!this.isAudioInitialized) {
      await SetupAudio();
      this.isAudioInitialized = true;
    }
    if (this.isInDrawingArea() && audioStore.rnboDevice) {
      audioStore.rnboDevice.startPlaying();
    }
  }

  handleMouseReleased() {
    if (audioStore.rnboDevice) {
      audioStore.rnboDevice.stopPlaying();
    }
  }

  setupCanvas() {
    this.canvas = this.p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawingBuffer = this.p.createGraphics(
      DRAWING_AREA_WIDTH,
      CANVAS_HEIGHT
    );
    this.drawingBuffer.colorMode(this.p.HSB, 360, 100, 100);

    const x = (this.p.windowWidth - CANVAS_WIDTH) / 2;
    const y = (this.p.windowHeight - CANVAS_HEIGHT) / 2;

    this.clearButton = this.p.createButton("🫧 clear");
    this.clearButton.position(x + 10, y + 10);
    this.clearButton.mousePressed(() => this.clearDrawing());

    this.colorToggleButton = this.p.createButton("🌱 green mode");
    this.colorToggleButton.position(x + 10, y + 40);
    this.colorToggleButton.mousePressed(() => {
      this.isRainbowMode = !this.isRainbowMode;
      this.colorToggleButton.html(
        this.isRainbowMode ? "🌈 rainbow mode" : "🌱 green mode"
      );
    });

    this.initDrawingBuffer();
    this.centerCanvas();
  }

  initDrawingBuffer() {
    this.drawingBuffer.clear();
    const padding = 10;
    this.drawingBuffer.noFill();
    this.drawingBuffer.stroke(150, 255, 150);
    this.drawingBuffer.strokeWeight(2);

    this.drawingBuffer.rect(
      padding,
      padding,
      DRAWING_AREA_WIDTH - padding * 2,
      CANVAS_HEIGHT - padding * 2
    );
  }

  clearDrawing() {
    this.initDrawingBuffer();
  }

  draw() {
    this.p.background(240);
    this.p.fill(220);
    this.p.noStroke();
    this.p.rect(0, 0, TOOL_AREA_WIDTH, CANVAS_HEIGHT);
    this.p.image(this.drawingBuffer, TOOL_AREA_WIDTH, 0);

    if (this.p.mouseIsPressed && this.isInDrawingArea()) {
      // Update audio parameters based on normalized mouse position
      if (audioStore.rnboDevice) {
        const adjustedX = this.p.mouseX - TOOL_AREA_WIDTH;
        const normalized = normalizePos(adjustedX, this.p.mouseY);

        // Update position (x-axis)
        this.pos = normalized.x;
        audioStore.rnboDevice.changePos(this.pos);

        // Update pitch (y-axis) - scaled to 0-1 range, top is 1
        this.pitch = 1 - normalized.y;
        audioStore.rnboDevice.changePitch(this.pitch);
      }

      if (this.isRainbowMode) {
        this.drawingBuffer.stroke(this.hue, 100, 100);
        this.hue = (this.hue + 5) % 360;
      } else {
        this.drawingBuffer.stroke(150, 255, 150);
      }
      this.drawingBuffer.strokeWeight(2);
      const adjustedX = this.p.mouseX - TOOL_AREA_WIDTH;
      const adjustedPX = this.p.pmouseX - TOOL_AREA_WIDTH;
      this.drawingBuffer.line(
        adjustedX,
        this.p.mouseY,
        adjustedPX,
        this.p.pmouseY
      );
    }

    // Display debug info
    this.p.fill(0);
    this.p.noStroke();
    this.p.textSize(12);
    this.p.textAlign(this.p.LEFT, this.p.BOTTOM);
    this.p.text(`pos: ${this.pos.toFixed(2)}`, 10, CANVAS_HEIGHT - 25);
    this.p.text(`pitch: ${this.pitch.toFixed(3)}`, 10, CANVAS_HEIGHT - 10);
  }

  isInDrawingArea(): boolean {
    return (
      this.p.mouseX > TOOL_AREA_WIDTH &&
      this.p.mouseX < CANVAS_WIDTH &&
      this.p.mouseY > 0 &&
      this.p.mouseY < CANVAS_HEIGHT
    );
  }

  handleWindowResize() {
    this.centerCanvas();
    const x = (this.p.windowWidth - CANVAS_WIDTH) / 2;
    const y = (this.p.windowHeight - CANVAS_HEIGHT) / 2;
    this.clearButton.position(x + 10, y + 10);
    this.colorToggleButton.position(x + 10, y + 40);
  }

  centerCanvas() {
    const x = (this.p.windowWidth - CANVAS_WIDTH) / 2;
    const y = (this.p.windowHeight - CANVAS_HEIGHT) / 2;
    this.canvas.position(x, y);
  }
}

new p5((p: p5) => new Sketch(p));
