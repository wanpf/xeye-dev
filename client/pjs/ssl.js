((

  config = JSON.decode(pipy.load('config.json')),

  {
    insert_pipy_db,
    update_pipy_db,
  } = pipy.solve('db.js'),

  { platform } = pipy.solve('utils.js'),

) => pipy({
  _sni: undefined,
  _beginTime: null,
  _newRecord: null,
  _statusCode: null,
  _requestSize:  0,
  _requestHeadText: null,
  _requestBodyBlob: null,
  _responseHeadText: null,
  _responseBodyBlob: null,
  _infos: null,
})

.import({
  __infos: 'main',
})

.export('ssl', {
  __target: null,
})

.pipeline('ssl-intercept')
.acceptTLS({
  certificate: (
    (
      key = new crypto.PrivateKey(pipy.load('crt/pkey.pem')),
      cache = new algo.Cache(
        cn => (
          console.log('Generate cert for', cn),
          platform === 0 ? (
            new crypto.Certificate(pipy.exec(`.\\crt\\mkcrt.cmd ${cn}`))
          ) : (
            new crypto.Certificate(pipy.exec(`crt/mkcrt.sh ${cn}`))
          )
        ),
        null,
        { ttl: 2500000 }
      ),
    ) => (
      sni => !sni ? undefined : { key, cert: cache.get(_sni = sni) }
    )
  )(),
  alpn: ['http/1.1'],
}).to($=>$
  .demuxHTTP().to($=>$
    .handleMessageStart(
      msg => (
        _beginTime = new Date(),
        msg.head.headers['x-b3-traceid'] = msg.head.headers['x-b3-spanid'] = algo.uuid().substring(0, 18).replaceAll('-', ''),
        __infos.gotRequestHeadersTS = Date.now(),
        config?.configs?.saveHeadAndBody && (
          _requestBodyBlob = new Data,
          _requestHeadText = JSON.stringify(msg.head, null, 2)
        ),
        _newRecord = insert_pipy_db('https', __inbound.remoteAddress, msg?.head?.headers?.host || '', msg?.head?.path || '', msg?.head?.headers?.['user-agent'] || '')
      )
    )
    .branch(
      config?.configs?.saveHeadAndBody, (
        $=>$
        .handleData(
          dat => _requestBodyBlob.push(dat)
        )
      )
    )
    .handleMessageEnd(
      msg => (
        __infos.doneRequestTS = Date.now(),
        _newRecord?.id && (_requestSize = (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0))
      )
    )
    .muxHTTP().to($=>$
      .connectTLS({ sni: () => _sni }).to($=>$
        .connect(() => __target, { ...config?.policies, onState: ob => (__infos[ob.state + 'TS'] = Date.now()) })
      )
    )
    .handleMessageStart(
      msg => (
        _statusCode = (msg?.head?.status || 0),
        config?.configs?.saveHeadAndBody && (
          _responseBodyBlob = new Data,
          _responseHeadText = JSON.stringify(msg.head, null, 2)
        )
      )
    )
    .branch(
      config?.configs?.saveHeadAndBody, (
        $=>$
        .handleData(
          dat => _responseBodyBlob.push(dat)
        )
      )
    )
    .handleMessageEnd(
      msg => _newRecord?.id && (
        __infos.target = __target,
        __infos.doneProxyTS = Date.now(),
        update_pipy_db(_newRecord?.id, new Date() - _beginTime, _statusCode, _requestHeadText, _requestBodyBlob, _responseHeadText, _responseBodyBlob, _requestSize, (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0), JSON.encode(__infos))
      )
    )
  )
)

)()
