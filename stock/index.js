(async function() {
    async function getCurrentMarketValue() {
        const response = await fetch('https://finnhub.io/api/v1/quote?symbol=DIBS&token=c3jhdhqad3i82raoe5f0');
        
        if (response.ok) {
            const marketData = await response.json()
            return marketData.c;
        }

        return 1;
    }

    function getOptionsData() {
        const storageData = window.localStorage.getItem('optionsData');
        if (storageData) {
            const optionsData = JSON.parse(storageData);
            if (optionsData && optionsData.length) {
                return optionsData;
            }
        }
        return [{total: 1}];
    }

    function getDesiredMarketValue() {
        return window.localStorage.getItem('desiredMarketValue') || 50;
    }

    function getNetValues(
        data,
        marketValue
    ) {
        const vestedValue = data.vested * marketValue - data.vested * data.price;
        const totalValue = data.total * marketValue - data.total * data.price;
        return {
            vestedValue,
            totalValue
        };
    }

    function renderTable(
        table,
    ) {
        const optionsData = getOptionsData();
        const totals = {
            total: 0,
            vested: 0,
            vestedValue: 0,
            totalValue: 0,
            dVestedValue: 0,
            dTotalValue: 0,
        };
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });
        const desiredMarketValue = getDesiredMarketValue();
        let tableRows = '';

        table.innerHTML = `
            <thead><tr>
                <th>Options</th>
                <th>Total</th>
                <th>Vested</th>
                <th>Exercise price</th>
                <th>Vested value</th>
                <th>Total value</th>
                <th>Desired vested value</th>
                <th>Desired total value</th>
                <th>Actions</th>
            </tr></thead>`;

        optionsData.forEach((data, index) => {
            data.vested = data.vested || data.total;
            data.price = data.price || 0;
            const {
                vestedValue,
                totalValue
            } = getNetValues(data, currentMarketValue);
            const {
                vestedValue: dVestedValue,
                totalValue: dTotalValue
            } = getNetValues(data, desiredMarketValue);

            tableRows += `
            <tr data-key="${index}" class="js-options-row">
                <th>${index+1}</th>
                <td><input type="number" name="total" value="${data.total}"></td>
                <td><input type="number" name="vested" value="${data.vested}"></td>
                <td><input type="number" name="price" value="${data.price}"></td>
                <td>${formatter.format(vestedValue)}</td>
                <td>${formatter.format(totalValue)}</td>
                <td>${formatter.format(dVestedValue)}</td>
                <td>${formatter.format(dTotalValue)}</td>
                <td>
                    <a name="remove" href="#remove" class="button is-danger is-outlined is-small">Remove Row</a>
                </td>
            </tr>`;

            totals.total += data.total;
            totals.vested += data.vested;
            totals.vestedValue += vestedValue;
            totals.totalValue += totalValue;
            totals.dVestedValue += dVestedValue;
            totals.dTotalValue += dTotalValue;
        });

        tableRows += `
            <tfoot><tr>
                <th><strong>Totals:</strong></th>
                <th>${totals.total}</th>
                <th>${totals.vested}</th>
                <th></th>
                <th>${formatter.format(totals.vestedValue)}</th>
                <th>${formatter.format(totals.totalValue)}</th>
                <th>${formatter.format(totals.dVestedValue)}</th>
                <th>${formatter.format(totals.dTotalValue)}</th>
                <td>
                    <a name="add" href="#add" class="button is-success is-outlined is-small">Add New Row</a>
                </td>
            </tr></tfoot>`;
        table.innerHTML += tableRows;
    }

    function saveAndRenderTable(
        table,
        optionsData
    ) {
        window.localStorage.setItem('optionsData', JSON.stringify(optionsData.filter(Boolean)));
        renderTable(table);
    }

    const currentMarketValue = await getCurrentMarketValue();
    const desiredMarketValue = getDesiredMarketValue();
    const table = document.createElement('table');
    table.className = 'table is-hoverable';
    const rootElement = document.querySelector('.js-root');
    rootElement.innerHTML = '';
    rootElement.innerHTML += `
        <div class="block">
            Current Market Value: <strong>${currentMarketValue}</strong>
            <br />
            Desired Market Value:
            <input type="number" name="desiredValue" value="${desiredMarketValue}">
        </div>  
    `;
    rootElement.append(table);
    renderTable(table);

    rootElement.addEventListener('change', ({
        target: element
    }) => {
        const name = element.getAttribute('name');
        const value = parseFloat(element.value);
        switch (name) {
        case 'total':
        case 'vested':
        case 'price':
            const index = element.closest('.js-options-row').getAttribute('data-key');
            if (index) {
                const optionsData = getOptionsData();
                optionsData[index][name] = value;
                saveAndRenderTable(table, optionsData);
            }
            break;
        case 'desiredValue':
            if (value) {
                window.localStorage.setItem('desiredMarketValue', value);
                renderTable(table);
            }
            break;
        }
    });

    rootElement.addEventListener('click', ({
        target: element
    }) => {
        const name = element.getAttribute('name');
        switch (name) {
        case 'remove':
            const index = element.closest('.js-options-row').getAttribute('data-key');
            if (index) {
                const optionsData = getOptionsData();
                delete optionsData[index];
                saveAndRenderTable(table, optionsData);
            }
            break;
        case 'add':
            const optionsData = getOptionsData();
            optionsData.push({
                total: 1
            });
            saveAndRenderTable(table, optionsData);
            break;
        }
    });
})();