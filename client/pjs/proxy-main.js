((

  config = JSON.decode(pipy.load('config.json')),

  {
    insert_pipy_db,
    update_pipy_db,
  } = pipy.solve('db.js'),

) => (

pipy({
  _pos: -1,
  _type: null,
  _path: null,
  _domain: null,
  _target: null,
  _statusCode: 0,
  _beginTime: undefined,
  _newRecord: undefined,
  _requestSize:  0,
  _requestHeadText: null,
  _requestBodyBlob: null,
  _responseHeadText: null,
  _responseBodyBlob: null,
})

.import({
  __infos: 'main',
  __target: 'ssl',
})

.pipeline('proxy')
.demuxHTTP().to(
  $=>$
  .handleMessageStart(
    msg => (
      _beginTime = new Date(),
      (msg?.head?.method === 'CONNECT') ? (
        _type = 'https'
      ) : msg?.head?.path?.startsWith('http://') ? (
        _type = 'http'
      ) : (
        _type = 'unsurport'
      ),
      config?.configs?.enableDebug && (
        console.log('proxy type, message:', _type, msg)
      ),
      ((_type !== 'https') || !config?.configs?.sslInterception) && (
        _newRecord = insert_pipy_db(_type, __inbound.remoteAddress, msg?.head?.headers?.host || '', msg?.head?.path || '', msg?.head?.headers?.['user-agent'] || '')
      )
    )
  )
  .branch(
    () => _type === 'http', (
      $=>$.link('http')
    ),
    () => _type === 'https', (
      $=>$.link('https')
    ),
    (
      $=>$.replaceMessage(
        () => (
          new Message({ status: 403 })
        )
      )
    )
  )
)

.pipeline('http')
.handleMessageStart(
  msg => (
    (_pos = msg.head.path.indexOf('/', 7)) > 7 && (
      _target = msg.head.path.substring(7, _pos),
      msg.head.path = _path = msg.head.path.substring(_pos),
      (_pos = _target.indexOf(':')) > 0 ? (
        _domain = _target.substring(0, _pos)
      ) : (
        _domain = _target,
        _target = _target + ':80'
      ),
      msg.head.headers['x-b3-traceid'] = msg.head.headers['x-b3-spanid'] = algo.uuid().substring(0, 18).replaceAll('-', '')
    ),
    __infos.gotRequestHeadersTS = Date.now(),
    config?.configs?.saveHeadAndBody && (
      _requestBodyBlob = new Data,
      _requestHeadText = JSON.stringify(msg.head, null, 2)
    )
  )
)
.branch(
  config?.configs?.saveHeadAndBody, (
    $=>$.handleData(
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
.branch(
  () => _target, (
    $=>$.muxHTTP().to(
      $=>$.link('connect')
    )
  ), (
    $=>$.replaceMessage(
      () => new Message({ status: 400 })
    )
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
    $=>$.handleData(
      dat => _responseBodyBlob.push(dat)
    )
  )
)
.handleMessageEnd(
  msg => _newRecord?.id && (
    __infos.target = _target,
    __infos.doneProxyTS = Date.now(),
    update_pipy_db(_newRecord?.id, new Date() - _beginTime, _statusCode, _requestHeadText, _requestBodyBlob, _responseHeadText, _responseBodyBlob, _requestSize, (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0), JSON.encode(__infos))
  )
)

.pipeline('https')
.acceptHTTPTunnel(
  msg => (
    _target = msg.head.path,
    (_pos = _target.indexOf(':')) > 0 ? (
      _domain = _target.substring(0, _pos)
    ) : (
      _domain = _target,
      _target = _target + ':443'
    ),
    new Message({ status: 200 })
  )
).to(
  $=>$
  .branch(
    () => config?.configs?.sslInterception, (
      $=>$
      .onStart(() => void (__target = _target))
      .use('ssl.js', 'ssl-intercept')
    ),
    (
      $=>$.link('connect')
    )
  )
)
.handleStreamEnd(
  () => _newRecord?.id && (
    update_pipy_db(_newRecord?.id, new Date() - _beginTime, _statusCode)
  )
)

.pipeline('connect')
.onStart(new Data)
.connect(() => _target, { ...config?.policies, onState: ob => (__infos[ob.state + 'TS'] = Date.now()) })

))()