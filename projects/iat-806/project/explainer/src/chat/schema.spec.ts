import { describe, expect, it } from 'vitest'
import { extractJson, parseReply } from './schema.ts'

const ctx = {
  blockIds: new Set(['b0', 'b1']),
  allowedLinks: new Set(['/projects/']),
  persona: 'plain' as const,
}

describe('extractJson', () => {
  it('handles fences and chatter', () => {
    expect(extractJson('Sure! ```json\n{"answer":"hi"}\n``` hope that helps')).toEqual({
      answer: 'hi',
    })
    expect(extractJson('{"a":1} trailing')).toEqual({ a: 1 })
    expect(extractJson('no json here')).toBeUndefined()
    expect(extractJson('{broken')).toBeUndefined()
  })
})

describe('parseReply', () => {
  it('keeps valid fields and drops invented ids and links', () => {
    const reply = parseReply(
      JSON.stringify({
        answer: 'This lab is about arrays.',
        keyPoints: ['one', 'two', 'three', 'four', 'five'],
        highlights: [
          { id: 'b1', note: 'here' },
          { id: 'b99', note: 'invented' },
        ],
        followUps: [
          { label: 'See all projects', href: '/projects/' },
          { label: 'Phishy', href: 'https://evil.example' },
          'Plain string chip',
        ],
        notOnPage: false,
        omen: 'should be dropped for plain',
      }),
      ctx,
    )
    expect(reply.answer).toBe('This lab is about arrays.')
    expect(reply.keyPoints).toHaveLength(4)
    expect(reply.highlights).toEqual([{ id: 'b1', note: 'here' }])
    expect(reply.followUps).toEqual([
      { label: 'See all projects', href: '/projects/' },
      { label: 'Phishy' },
      { label: 'Plain string chip' },
    ])
    expect(reply.omen).toBeUndefined()
  })

  it('keeps the omen for Sage', () => {
    const reply = parseReply('{"answer":"x","omen":"The vines whisper."}', {
      ...ctx,
      persona: 'sage',
    })
    expect(reply.omen).toBe('The vines whisper.')
  })

  it('uses plain text replies as the answer', () => {
    const reply = parseReply('This page shows a bubble game.', ctx)
    expect(reply.answer).toBe('This page shows a bubble game.')
    expect(reply.fallback).toBe(false)
  })

  it('falls back when there is nothing usable', () => {
    expect(parseReply('', ctx).fallback).toBe(true)
    expect(parseReply('{"keyPoints":[]}', ctx).fallback).toBe(true)
  })
})
