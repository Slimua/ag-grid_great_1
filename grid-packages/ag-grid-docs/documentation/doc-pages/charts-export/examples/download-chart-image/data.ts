export function getData(): {
    date: Date;
    cpih: number;
    cpi: number;
    ooh: number;
    totalPay: number;
    regularPay: number;
}[] {
    return [
        {
            date: new Date('May 2018'),
            cpih: 2.3,
            cpi: 2.4,
            ooh: 1.1,
            totalPay: 0.2,
            regularPay: 0.3,
        },
        {
            date: new Date('Jun 2018'),
            cpih: 2.3,
            cpi: 2.4,
            ooh: 1.1,
            totalPay: -0.2,
            regularPay: 0.5,
        },
        {
            date: new Date('Jul 2018'),
            cpih: 2.3,
            cpi: 2.5,
            ooh: 1.1,
            totalPay: 1,
            regularPay: 0.8,
        },
        {
            date: new Date('Aug 2018'),
            cpih: 2.4,
            cpi: 2.7,
            ooh: 1.0,
            totalPay: 0.8,
            regularPay: 0.9,
        },
        {
            date: new Date('Sep 2018'),
            cpih: 2.2,
            cpi: 2.4,
            ooh: 1.0,
            totalPay: 0.6,
            regularPay: 0.9,
        },
        {
            date: new Date('Oct 2018'),
            cpih: 2.2,
            cpi: 2.4,
            ooh: 1.1,
            totalPay: 1.9,
            regularPay: 1.2,
        },
        {
            date: new Date('Nov 2018'),
            cpih: 2.2,
            cpi: 2.3,
            ooh: 1.1,
            totalPay: 1.1,
            regularPay: 1.2,
        },
        {
            date: new Date('Dec 2018'),
            cpih: 2.0,
            cpi: 2.1,
            ooh: 1.2,
            totalPay: 1.2,
            regularPay: 1.2,
        },
        {
            date: new Date('Jan 2019'),
            cpih: 1.8,
            cpi: 1.8,
            ooh: 1.1,
            totalPay: 1.9,
            regularPay: 1.8,
        },
        {
            date: new Date('Feb 2019'),
            cpih: 1.8,
            cpi: 1.9,
            ooh: 1.1,
            totalPay: 1.7,
            regularPay: 1.4,
        },
        {
            date: new Date('Mar 2019'),
            cpih: 1.8,
            cpi: 1.9,
            ooh: 1.1,
            totalPay: 0.6,
            regularPay: 1.3,
        },
        {
            date: new Date('Apr 2019'),
            cpih: 2.0,
            cpi: 2.1,
            ooh: 1.2,
            totalPay: 2,
            regularPay: 2,
        },
        {
            date: new Date('May 2019'),
            cpih: 1.9,
            cpi: 2.0,
            ooh: 1.2,
            totalPay: 2,
            regularPay: 1.9,
        },
        {
            date: new Date('Jun 2019'),
            cpih: 1.9,
            cpi: 2.0,
            ooh: 1.2,
            totalPay: 1.9,
            regularPay: 2.1,
        },
        {
            date: new Date('Jul 2019'),
            cpih: 2.0,
            cpi: 2.1,
            ooh: 1.2,
            totalPay: 2.1,
            regularPay: 1.8,
        },
        {
            date: new Date('Aug 2019'),
            cpih: 1.7,
            cpi: 1.7,
            ooh: 1.1,
            totalPay: 1.5,
            regularPay: 1.8,
        },
        {
            date: new Date('Sep 2019'),
            cpih: 1.7,
            cpi: 1.7,
            ooh: 1.1,
            totalPay: 2.4,
            regularPay: 1.9,
        },
        {
            date: new Date('Oct 2019'),
            cpih: 1.5,
            cpi: 1.5,
            ooh: 1.2,
            totalPay: 0.9,
            regularPay: 1.6,
        },
        {
            date: new Date('Nov 2019'),
            cpih: 1.5,
            cpi: 1.5,
            ooh: 1.2,
            totalPay: 1.6,
            regularPay: 1.7,
        },
        {
            date: new Date('Dec 2019'),
            cpih: 1.4,
            cpi: 1.3,
            ooh: 1.2,
            totalPay: 1.3,
            regularPay: 1.8,
        },
        {
            date: new Date('Jan 2020'),
            cpih: 1.8,
            cpi: 1.8,
            ooh: 1.3,
            totalPay: 1.3,
            regularPay: 0.9,
        },
        {
            date: new Date('Feb 2020'),
            cpih: 1.7,
            cpi: 1.7,
            ooh: 1.2,
            totalPay: 1,
            regularPay: 1.2,
        },
        {
            date: new Date('Mar 2020'),
            cpih: 1.5,
            cpi: 1.5,
            ooh: 1.3,
            totalPay: -0.2,
            regularPay: 0.9,
        },
        {
            date: new Date('Apr 2020'),
            cpih: 0.9,
            cpi: 0.8,
            ooh: 1.1,
            totalPay: -2,
            regularPay: -0.9,
        },
        {
            date: new Date('May 2020'),
            cpih: 0.7,
            cpi: 0.5,
            ooh: 1.1,
            totalPay: -2,
            regularPay: -0.8,
        },
        {
            date: new Date('Jun 2020'),
            cpih: 0.8,
            cpi: 0.6,
            ooh: 1.2,
            totalPay: -2.2,
            regularPay: -0.9,
        },
        {
            date: new Date('Jul 2020'),
            cpih: 1.1,
            cpi: 1.0,
            ooh: 1.1,
            totalPay: -1.3,
            regularPay: -0.1,
        },
        {
            date: new Date('Aug 2020'),
            cpih: 0.5,
            cpi: 0.2,
            ooh: 1.1,
            totalPay: 1.6,
            regularPay: 1.5,
        },
        {
            date: new Date('Sep 2020'),
            cpih: 0.7,
            cpi: 0.5,
            ooh: 1.2,
            totalPay: 1.3,
            regularPay: 2.1,
        },
        {
            date: new Date('Oct 2020'),
            cpih: 0.9,
            cpi: 0.7,
            ooh: 1.2,
            totalPay: 3.1,
            regularPay: 2.8,
        },
        {
            date: new Date('Nov 2020'),
            cpih: 0.6,
            cpi: 0.3,
            ooh: 1.2,
            totalPay: 4.8,
            regularPay: 3.6,
        },
        {
            date: new Date('Dec 2020'),
            cpih: 0.8,
            cpi: 0.6,
            ooh: 1.3,
            totalPay: 3.9,
            regularPay: 3.5,
        },
        {
            date: new Date('Jan 2021'),
            cpih: 0.9,
            cpi: 0.7,
            ooh: 1.3,
            totalPay: 3.7,
            regularPay: 3.3,
        },
        {
            date: new Date('Feb 2021'),
            cpih: 0.7,
            cpi: 0.4,
            ooh: 1.4,
            totalPay: 3.3,
            regularPay: 3.6,
        },
        {
            date: new Date('Mar 2021'),
            cpih: 1.0,
            cpi: 0.7,
            ooh: 1.3,
            totalPay: 2.9,
            regularPay: 3.8,
        },
        {
            date: new Date('Apr 2021'),
            cpih: 1.6,
            cpi: 1.5,
            ooh: 1.4,
            totalPay: 7.8,
            regularPay: 5.9,
        },
        {
            date: new Date('May 2021'),
            cpih: 2.1,
            cpi: 2.1,
            ooh: 1.5,
            totalPay: 7.1,
            regularPay: 5.3,
        },
        {
            date: new Date('Jun 2021'),
            cpih: 2.4,
            cpi: 2.5,
            ooh: 1.6,
            totalPay: 6.4,
            regularPay: 4.6,
        },
        {
            date: new Date('Jul 2021'),
            cpih: 2.1,
            cpi: 2.0,
            ooh: 1.6,
            totalPay: 5.1,
            regularPay: 3.8,
        },
        {
            date: new Date('Aug 2021'),
            cpih: 3.0,
            cpi: 3.2,
            ooh: 1.7,
            totalPay: 2.7,
            regularPay: 1.8,
        },
        {
            date: new Date('Sep 2021'),
            cpih: 2.9,
            cpi: 3.1,
            ooh: 1.8,
            totalPay: 1.8,
            regularPay: 1.1,
        },
        {
            date: new Date('Oct 2021'),
            cpih: 3.8,
            cpi: 4.2,
            ooh: 1.9,
            totalPay: 0.6,
            regularPay: 0,
        },
        {
            date: new Date('Nov 2021'),
            cpih: 4.6,
            cpi: 5.1,
            ooh: 2.1,
            totalPay: -0.9,
            regularPay: -1,
        },
        {
            date: new Date('Dec 2021'),
            cpih: 4.8,
            cpi: 5.4,
            ooh: 2.2,
            totalPay: 1,
            regularPay: -1.1,
        },
        {
            date: new Date('Jan 2022'),
            cpih: 4.9,
            cpi: 5.5,
            ooh: 2.4,
            totalPay: 0.4,
            regularPay: -0.6,
        },
        {
            date: new Date('Feb 2022'),
            cpih: 5.5,
            cpi: 6.2,
            ooh: 2.5,
            totalPay: 0.3,
            regularPay: -1.2,
        },
        {
            date: new Date('Mar 2022'),
            cpih: 6.2,
            cpi: 7.0,
            ooh: 2.7,
            totalPay: 3.6,
            regularPay: -1.9,
        },
        {
            date: new Date('Apr 2022'),
            cpih: 7.8,
            cpi: 9.0,
            ooh: 2.9,
            totalPay: -2.6,
            regularPay: -3.5,
        },
        {
            date: new Date('May 2022'),
            cpih: 7.9,
            cpi: 9.1,
            ooh: 3.0,
            totalPay: -3.5,
            regularPay: -2.9,
        },
    ];
}
