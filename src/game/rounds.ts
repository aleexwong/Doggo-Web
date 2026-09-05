import { Breed, fetchRandomImage, preloadImage } from './api'

export interface Round {
  answer: Breed
  choices: Breed[]
  imageUrl: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

/**
 * Build a round: random answer breed, a random photo of it (preloaded),
 * and 3 distinct distractors. Retries a couple of times on image failure.
 */
const parentOf = (path: string) => path.split('/')[0]

/** Three distractors, preferring different parent breeds so a round isn't
 *  decided between near-identical siblings (e.g. two retriever sub-breeds). */
export function pickDistractors(breeds: Breed[], answer: Breed): Breed[] {
  const pool = breeds.filter((b) => b.path !== answer.path)
  const answerParent = parentOf(answer.path)
  const different = shuffle(pool.filter((b) => parentOf(b.path) !== answerParent))
  const chosen = different.slice(0, 3)
  if (chosen.length < 3) {
    const rest = shuffle(pool.filter((b) => !chosen.includes(b)))
    chosen.push(...rest.slice(0, 3 - chosen.length))
  }
  return chosen
}

export async function buildRound(breeds: Breed[], attempts = 3): Promise<Round> {
  const answer = pick(breeds)
  try {
    const imageUrl = await fetchRandomImage(answer)
    await preloadImage(imageUrl)
    const distractors = pickDistractors(breeds, answer)
    return { answer, choices: shuffle([answer, ...distractors]), imageUrl }
  } catch (err) {
    if (attempts > 1) return buildRound(breeds, attempts - 1)
    throw err
  }
}
