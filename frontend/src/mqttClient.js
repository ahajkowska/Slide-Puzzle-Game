
let mqttClientInstance;

export function getMQTTClient() {
    if (!mqttClientInstance) {
        mqttClientInstance = mqtt.connect('wss://test.mosquitto.org:8081/mqtt');

        mqttClientInstance.on('connect', () => {
            console.log('MQTT connected');
        });

        mqttClientInstance.on('error', (err) => {
            console.error('MQTT Error:', err);
        });
    }

    return mqttClientInstance;
}
