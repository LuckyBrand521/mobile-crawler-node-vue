import got from "got";
require('dotenv').config({ path: '../.env' });

interface Ports {
    http: number;
    socks5: number;
}

interface Proxy {
    username: string;
    password: string;
    proxy_address: string;
    ports: Ports;
    valid: boolean;
    last_verification: Date;
    country_code: string;
    country_code_confidence: number;
}

interface ProxyResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Proxy[];
}

const USERAGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.192 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
]

let proxies: Proxy[] = [];

const API_KEY = process.env.API_KEY;

const client = got.extend({
    prefixUrl: "https://proxy.webshare.io/api/",
    headers: {
        "Authorization": `Token ${API_KEY}`,
    },
})

async function fetchProxies() {
    const response: ProxyResponse = await client.get("proxy/list/").json();
    proxies = response.results.filter(proxy => proxy.valid);
}

setInterval(fetchProxies, 1000 * 60 * 10);

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

export function getUserAgent() {
    return USERAGENTS[getRandom(0, USERAGENTS.length-1)];
}

export async function getProxy() {
    if (!proxies.length) await fetchProxies();
    const randomProxy = proxies[getRandom(0, proxies.length - 1)];
    const { proxy_address, ports: { http: httpPort, socks5: socks5Port }, username, password } = randomProxy;
    return `socks5://${username}:${password}@${proxy_address}:${socks5Port}`;
}
