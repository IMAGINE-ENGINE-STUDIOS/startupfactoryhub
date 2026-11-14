/*
 * Prototype Studio — component registry (Job 2).
 *
 * Every spec below is taken from the manufacturer's public datasheet
 * or official product documentation, named in `source` on each record.
 * Anything not publicly sourced is left out rather than invented —
 * indicative prices are deliberately NOT in v1 (no sourced price list
 * exists yet; that is a named gap, prices join the BOM when sourced).
 */

export type ProtoCategory = "controller" | "sensor" | "output" | "power" | "comms";

export type PortKind =
  | "power-in"
  | "power-out"
  | "gpio"
  | "analog"
  | "pwm"
  | "i2c"
  | "spi"
  | "uart";

export interface ProtoPort {
  id: string;
  label: string;
  kind: PortKind;
  /** For power-out: the voltage it supplies. For signal ports: the
   *  voltage this port outputs (checked against the receiver). */
  voltage?: number;
  /** For signal inputs: minimum input-high voltage, if the datasheet
   *  sets one above a typical logic level (drives a warning). */
  minVoltage?: number;
}

export interface ComponentSpec {
  id: string;
  name: string;
  category: ProtoCategory;
  summary: string;
  /** Operating supply range (V). */
  voltageMin: number;
  voltageMax: number;
  /** Logic level the component speaks / tolerates on signal pins. */
  logicVoltage: number;
  /** Typical current draw in mA (for power sources: capacity). */
  currentMa: number;
  ports: ProtoPort[];
  source: string;
}

export interface PlacedComponent {
  uid: string;
  specId: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  fromUid: string;
  fromPort: string;
  toUid: string;
  toPort: string;
}

export interface DesignDoc {
  components: PlacedComponent[];
  connections: Connection[];
}

export const CATEGORY_LABELS: Record<ProtoCategory, string> = {
  controller: "Controllers",
  sensor: "Sensors",
  output: "Outputs",
  power: "Power",
  comms: "Radios & comms",
};

const gpio = (ids: string[]): ProtoPort[] => ids.map((id) => ({ id, label: id.toUpperCase(), kind: "gpio" as const }));

export const COMPONENTS: ComponentSpec[] = [
  {
    id: "esp32",
    name: "ESP32 Dev Board",
    category: "controller",
    summary: "Dual-core 240 MHz controller with Wi-Fi and Bluetooth LE built in — the default brain for connected prototypes.",
    voltageMin: 3.0, voltageMax: 3.6, logicVoltage: 3.3, currentMa: 160,
    ports: [
      { id: "vin", label: "5V IN", kind: "power-in" },
      ...gpio(["d13", "d12", "d14", "d27", "d26", "d25"]),
      { id: "a0", label: "A0", kind: "analog" }, { id: "a1", label: "A1", kind: "analog" },
      { id: "pwm1", label: "PWM1", kind: "pwm" }, { id: "pwm2", label: "PWM2", kind: "pwm" },
      { id: "i2c", label: "I2C", kind: "i2c" },
      { id: "uart", label: "UART", kind: "uart" },
    ],
    source: "Espressif ESP32-WROOM-32 datasheet",
  },
  {
    id: "arduino-uno",
    name: "Arduino Uno R3",
    category: "controller",
    summary: "The classic 5 V teaching board (ATmega328P) — huge shield ecosystem, forgiving for first builds.",
    voltageMin: 5, voltageMax: 5, logicVoltage: 5, currentMa: 45,
    ports: [
      { id: "vin", label: "VIN 7–12V", kind: "power-in" },
      ...gpio(["d2", "d4", "d7", "d8"]),
      { id: "a0", label: "A0", kind: "analog" }, { id: "a1", label: "A1", kind: "analog" }, { id: "a2", label: "A2", kind: "analog" },
      { id: "pwm1", label: "PWM ~9", kind: "pwm" }, { id: "pwm2", label: "PWM ~10", kind: "pwm" },
      { id: "i2c", label: "I2C", kind: "i2c" },
      { id: "uart", label: "UART", kind: "uart" },
    ],
    source: "Arduino Uno R3 datasheet (docs.arduino.cc)",
  },
  {
    id: "pico",
    name: "Raspberry Pi Pico",
    category: "controller",
    summary: "RP2040 dual-core board — low power, precise timing (PIO), 3.3 V logic.",
    voltageMin: 3.0, voltageMax: 3.6, logicVoltage: 3.3, currentMa: 25,
    ports: [
      { id: "vin", label: "VSYS IN", kind: "power-in" },
      ...gpio(["gp2", "gp3", "gp4", "gp5"]),
      { id: "a0", label: "A0", kind: "analog" }, { id: "a1", label: "A1", kind: "analog" },
      { id: "pwm1", label: "PWM1", kind: "pwm" },
      { id: "i2c", label: "I2C", kind: "i2c" },
      { id: "uart", label: "UART", kind: "uart" },
      { id: "spi", label: "SPI", kind: "spi" },
    ],
    source: "Raspberry Pi Pico datasheet (RP2040)",
  },
  {
    id: "dht22",
    name: "DHT22 Temperature & Humidity",
    category: "sensor",
    summary: "Calibrated digital temperature (±0.5 °C) and humidity (±2–5% RH) on a single data pin. Its data line is open-drain — the signal level follows whichever rail powers it.",
    voltageMin: 3.3, voltageMax: 5.5, logicVoltage: 5, currentMa: 2,
    ports: [
      { id: "vcc", label: "VCC", kind: "power-in" },
      { id: "data", label: "DATA", kind: "gpio" },
    ],
    source: "Aosong AM2302 / DHT22 datasheet",
  },
  {
    id: "hcsr04",
    name: "HC-SR04 Ultrasonic Distance",
    category: "sensor",
    summary: "Distance by sonar, 2 cm – 400 cm. Its Echo pin outputs 5 V — a classic 3.3 V hazard the checker guards.",
    voltageMin: 5, voltageMax: 5, logicVoltage: 5, currentMa: 15,
    ports: [
      { id: "vcc", label: "VCC 5V", kind: "power-in" },
      { id: "trig", label: "TRIG", kind: "gpio" },
      { id: "echo", label: "ECHO 5V", kind: "gpio", voltage: 5 },
    ],
    source: "Elecfreaks HC-SR04 datasheet",
  },
  {
    id: "pir",
    name: "HC-SR501 PIR Motion Sensor",
    category: "sensor",
    summary: "Detects warm-body motion up to ~7 m; outputs a calm 3.3 V signal even on a 5 V supply.",
    voltageMin: 5, voltageMax: 12, logicVoltage: 3.3, currentMa: 1,
    ports: [
      { id: "vcc", label: "VCC", kind: "power-in" },
      { id: "out", label: "OUT 3.3V", kind: "gpio", voltage: 3.3 },
    ],
    source: "HC-SR501 datasheet",
  },
  {
    id: "ldr",
    name: "GL5528 Photoresistor (LDR)",
    category: "sensor",
    summary: "Light-dependent resistor — read it on an analog pin (in a divider) to sense light level.",
    voltageMin: 0, voltageMax: 150, logicVoltage: 5, currentMa: 1,
    ports: [{ id: "sig", label: "SIGNAL", kind: "analog" }],
    source: "GL5528 photoresistor datasheet",
  },
  {
    id: "bme280",
    name: "BME280 Environmental Sensor",
    category: "sensor",
    summary: "Bosch pressure, humidity and temperature on I2C — the weather-station standard.",
    voltageMin: 1.71, voltageMax: 3.6, logicVoltage: 3.3, currentMa: 1,
    ports: [
      { id: "vcc", label: "VCC 3.3V", kind: "power-in" },
      { id: "i2c", label: "I2C", kind: "i2c" },
    ],
    source: "Bosch BME280 datasheet",
  },
  {
    id: "neopixel",
    name: "WS2812B LED Strip (30 LED)",
    category: "output",
    summary: "Addressable RGB strip, one data wire. Full-white draw is 60 mA per LED — power budgets bite here.",
    voltageMin: 5, voltageMax: 5, logicVoltage: 5, currentMa: 600,
    ports: [
      { id: "vcc", label: "5V IN", kind: "power-in" },
      { id: "din", label: "DATA IN", kind: "gpio", minVoltage: 3.5 },
    ],
    source: "Worldsemi WS2812B datasheet",
  },
  {
    id: "sg90",
    name: "SG90 Micro Servo",
    category: "output",
    summary: "9 g servo, ~180° sweep on a PWM signal — doors, dials, little arms.",
    voltageMin: 4.8, voltageMax: 6, logicVoltage: 5, currentMa: 250,
    ports: [
      { id: "vcc", label: "VCC", kind: "power-in" },
      { id: "sig", label: "SIGNAL", kind: "pwm" },
    ],
    source: "Tower Pro SG90 specification",
  },
  {
    id: "oled",
    name: "SSD1306 OLED Display 128×64",
    category: "output",
    summary: "Crisp monochrome display on I2C — status screens for any prototype.",
    voltageMin: 3.3, voltageMax: 5, logicVoltage: 5, currentMa: 20,
    ports: [
      { id: "vcc", label: "VCC", kind: "power-in" },
      { id: "i2c", label: "I2C", kind: "i2c" },
    ],
    source: "Solomon Systech SSD1306 datasheet",
  },
  {
    id: "relay1",
    name: "Relay Module, 1 Channel",
    category: "output",
    summary: "Switch mains-class loads (lamps, pumps) safely isolated from your controller.",
    voltageMin: 5, voltageMax: 5, logicVoltage: 5, currentMa: 70,
    ports: [
      { id: "vcc", label: "VCC 5V", kind: "power-in" },
      { id: "in", label: "IN", kind: "gpio" },
    ],
    source: "Songle SRD-05VDC-SL-C relay datasheet (module core)",
  },
  {
    id: "usb5v",
    name: "USB Power Supply 5V 2A",
    category: "power",
    summary: "Bench/wall power — the default source for 5 V designs.",
    voltageMin: 5, voltageMax: 5, logicVoltage: 5, currentMa: 2000,
    ports: [{ id: "out", label: "5V OUT", kind: "power-out", voltage: 5 }],
    source: "Standard USB 5 V supply class (USB-IF)",
  },
  {
    id: "lipo18650",
    name: "18650 Li-ion Cell 3.7V",
    category: "power",
    summary: "Rechargeable portable power, 3.7 V nominal (4.2 V full, 3.0 V empty).",
    voltageMin: 3.7, voltageMax: 3.7, logicVoltage: 3.7, currentMa: 2000,
    ports: [{ id: "out", label: "3.7V OUT", kind: "power-out", voltage: 3.7 }],
    source: "18650 Li-ion cell datasheet class (3.7 V nominal)",
  },
  {
    id: "battery9v",
    name: "9V Battery",
    category: "power",
    summary: "Simple primary power for 7–12 V inputs (e.g. Arduino VIN). Modest current — keep loads light.",
    voltageMin: 9, voltageMax: 9, logicVoltage: 9, currentMa: 300,
    ports: [{ id: "out", label: "9V OUT", kind: "power-out", voltage: 9 }],
    source: "Energizer 522 (9 V) datasheet class",
  },
  {
    id: "hc05",
    name: "HC-05 Bluetooth Module",
    category: "comms",
    summary: "Classic Bluetooth serial bridge on UART, 3.3 V logic.",
    voltageMin: 3.3, voltageMax: 6, logicVoltage: 3.3, currentMa: 30,
    ports: [
      { id: "vcc", label: "VCC", kind: "power-in" },
      { id: "uart", label: "UART", kind: "uart" },
    ],
    source: "HC-05 Bluetooth module datasheet",
  },
  {
    id: "gps",
    name: "NEO-M8N GPS Module",
    category: "comms",
    summary: "u-blox positioning on UART — where is the device, anywhere on Earth.",
    voltageMin: 3.3, voltageMax: 5, logicVoltage: 3.3, currentMa: 45,
    ports: [
      { id: "vcc", label: "VCC", kind: "power-in" },
      { id: "uart", label: "UART", kind: "uart" },
    ],
    source: "u-blox NEO-M8 series datasheet",
  },
  {
    id: "lora",
    name: "LoRa Module Ra-02 (SX1278)",
    category: "comms",
    summary: "Kilometre-range radio on SPI. Strictly 3.3 V — 5 V kills it, and the checker knows.",
    voltageMin: 3.3, voltageMax: 3.3, logicVoltage: 3.3, currentMa: 120,
    ports: [
      { id: "vcc", label: "VCC 3.3V", kind: "power-in" },
      { id: "spi", label: "SPI", kind: "spi" },
    ],
    source: "Semtech SX1278 datasheet / Ai-Thinker Ra-02",
  },
];

export const specById = (id: string): ComponentSpec | undefined =>
  COMPONENTS.find((c) => c.id === id);
