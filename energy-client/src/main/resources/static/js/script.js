async function sendData() {
    const sensorId = document.getElementById('sensorId').value;
    const value = parseFloat(document.getElementById('consumption').value);
    const resultDiv = document.getElementById('result');

    resultDiv.innerText = "Invio in corso...";

    const payload = {
        sensorId: sensorId,
        consumptionValue: value
    };

    try {
        // Chiamata al backend Spring Boot
        const response = await fetch('http://localhost:8080/api/demo_poc/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Errore HTTP: " + response.status);

        const data = await response.json();
        
        // Output formattato
        resultDiv.innerText = `
        STATUS: ${data.status}
        PREVISIONE: ${data.predictedValue.toFixed(2)} kWh
        MSG: ${data.message}
        `;

    } catch (error) {
        resultDiv.innerText = "ERRORE DI CONNESSIONE:\n" + error;
        resultDiv.style.color = "red";
    }
}