import { InterruptMonitor, MPU6050, Utils } from "@ros2jsguy/mpu6050-motion-data";
import * as os from 'os';

const GPIO_MPU6050_DATA_PIN = 18;

console.log('User: ', process.env.USER);
const userInfo = os.userInfo();
console.log('User ID: ', userInfo.uid);

const gravity = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};

const velocity = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};

const position = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
};

function low_pass(accel) {
  const alpha = 0.8;

  gravity.x = alpha * gravity.x + (1 - alpha) * accel.x;
  gravity.y = alpha * gravity.y + (1 - alpha) * accel.y;
  gravity.z = alpha * gravity.z + (1 - alpha) * accel.z;

  const values = {
    x: accel.x - gravity.x,
    y: accel.y - gravity.y,
    z: accel.z - gravity.z,
  };

  return values;
}

function integrate_velocity(accel) {
  
}

functon integrate_position(velocity) {
}

function main() {
  let interrupts = 0;

  const imu = new MPU6050();
  imu.initialize();
  
  console.log('MPU6050 Device')
  console.log('       connected: ', imu.testConnection());
  console.log('              id: ', imu.getDeviceID());
  console.log('  temperature(F): ', imu.getTemperature().toFixed(2));
  Utils.msleep(500);

  console.log('\nDMP initialize and calibrate...');
  imu.dmpInitialize();

  // calibrate sensors
  imu.calibrateAccel();
//  imu.calibrateGyro();
  imu.printActiveOffsets();

  // setup interrupt
  imu.setInterruptLatchEnabled(true);
  imu.setInterruptDMPEnabled(true);

  // setup interrupt event monitoring and handling
  const interruptMonitor = new InterruptMonitor(GPIO_MPU6050_DATA_PIN);
  interruptMonitor.on('data', () => {
      if (++interrupts === 1) console.log('  Receiving interrupt(s)');
      const buf = imu.dmpGetCurrentFIFOPacket();
      if (buf) {
        const data = imu.dmpGetMotionData(buf);
        console.log(data);
        const filtered = low_pass(data.accel);
        console.log({ filtered: filtered });
      }
  });
  interruptMonitor.on('error', error => {
    console.log('Data error:', error.message);
  });
  interruptMonitor.start();

  // run for 10 seconds then shutdown process
  setTimeout(()=>{
    imu.shutdown();
    interruptMonitor.shutdown();
    
    process.exit(0);
  }, 10000);

  console.log('\nSampling data for 10 seconds');
  imu.setDMPEnabled(true); // start DMP, data-ready interrupts should be raised
  console.log('  Waiting for interrupts');
}

main();
