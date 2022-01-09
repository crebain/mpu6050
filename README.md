## Set up GPIO:

https://unix.stackexchange.com/a/542303

```
KERNEL=="i2c-[0-9]*", GROUP="i2c", MODE="0660"
```

## Set up I2C:

https://lexruee.ch/setting-i2c-permissions-for-non-root-users.html


... and all that still won't help because you still need root to access /dev/mem: https://unix.stackexchange.com/a/475807

