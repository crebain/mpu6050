import { InterruptMonitor, MPU6050, Utils } from "@ros2jsguy/mpu6050-motion-data";

const GPIO_MPU6050_DATA_PIN = 18;

function main() {
  let interrupts = 0;

  const imu = new MPU6050();
  imu.initialize();
  
  console.log('MPU6050 Device')
  console.log('       connected: ', imu.testConnection());
  console.log('              id: ', imu.getDeviceID());
  console.log('  temperature(F): ', Utils.celciusToF(imu.getTemperature()).toFixed(2));
  Utils.msleep(500);

  console.log('\nDMP initialize and calibrate...');
  imu.dmpInitialize();

  // calibrate sensors
  imu.calibrateAccel();
  imu.calibrateGyro();
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
      }
  });
  interruptMonitor.on('error', (error: Error) => {
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
