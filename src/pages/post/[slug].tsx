import Prismic from '@prismicio/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { RichText } from 'prismic-dom'
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi'
import Comments from '../../components/Comments'
import { PreviewButton } from '../../components/PreviewButton'
import { getPrismicClient } from '../../services/prismic'
import commonStyles from '../../styles/common.module.scss'
import styles from './post.module.scss'
interface Post {
  first_publication_date: string | null
  data: {
    title: string
    banner: {
      url: string
    }
    author: string
    content: {
      heading: string
      body: {
        type: string
        text: string
      }[]
    }[]
  }
}

interface PostNeighbor {
  title: string
  link: string
}

interface PostProps {
  post: Post
  preview: boolean
  nextPost?: PostNeighbor
  previousPost?: PostNeighbor
}

export default function Post({
  post,
  preview,
  nextPost,
  previousPost,
}: PostProps): JSX.Element {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const wordsQuantity = post.data.content.reduce((acc, section) => {
    const words = RichText.asText(section.body).split(' ')
    return acc + words.length
  }, 0)

  const timeReadInMinutes = Math.ceil(wordsQuantity / 200)

  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>

      <section className={styles.banner}>
        {/* <Image src={post.data.banner.url} alt="Banner" /> */}
      </section>

      <main className={`${commonStyles.container} ${styles.container}`}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.info}>
            <div>
              <FiCalendar size={20} color="#bbbbbb" />

              <span>
                {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                  locale: ptBR,
                })}
              </span>
            </div>

            <div>
              <FiUser size={20} color="#bbbbbb" />

              <span>{post.data.author}</span>
            </div>

            <div>
              <FiClock size={20} color="#bbbbbb" />

              <span>{timeReadInMinutes} min</span>
            </div>
          </div>

          <div className={styles.contentPost}>
            {post?.data?.content.map((item, i) => (
              <div key={item.heading} className={styles.sectionPost}>
                <h2>{item.heading}</h2>

                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(item.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>

        <hr />

        <nav className={styles.navigationPosts}>
          <div className={styles.previous}>
            {previousPost && (
              <Link href={previousPost.link}>
                <a>
                  <span>{previousPost.title}</span>
                  <strong>Post anterior</strong>
                </a>
              </Link>
            )}
          </div>

          <div className={styles.next}>
            {nextPost && (
              <Link href={nextPost.link}>
                <a>
                  <span>{nextPost.title}</span>
                  <strong>Proximo Post</strong>
                </a>
              </Link>
            )}
          </div>
        </nav>

        <Comments className={styles.comments} />

        {preview && (
          <aside>
            <PreviewButton />
          </aside>
        )}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient()

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 3 }
  )

  const paths =
    posts?.results.map(result => {
      return {
        params: {
          slug: result.uid,
        },
      }
    }) ?? []
  return {
    paths,
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps<PostProps, any, any> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params

  const prismic = getPrismicClient()
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  })

  const nextPost = await prismic.queryFirst(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  )

  const previousPost = await prismic.queryFirst(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  )

  const nextPostLink = nextPost
    ? {
        title: nextPost.data.title,
        link: `/post/${nextPost.uid}`,
      }
    : null
  const previousPostLink = previousPost
    ? {
        title: previousPost.data.title,
        link: `/post/${previousPost.uid}`,
      }
    : null

  return {
    props: {
      post: response,
      nextPost: nextPostLink,
      previousPost: previousPostLink,
      preview,
    },
    revalidate: 24 * 60 * 60, // 1 day
  }
}
