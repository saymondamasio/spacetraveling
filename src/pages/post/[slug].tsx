import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import Link from 'next/link';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';
import { PreviewButton } from '../../components/PreviewButton';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const wordsQuantity = post.data.content.reduce((acc, section) => {
    const words = RichText.asText(section.body).split(' ');
    return acc + words.length;
  }, 0);

  const timeReadInMinutes = Math.ceil(wordsQuantity / 200);

  return (
    <div>
      <img className={styles.banner} src={post.data.banner.url} alt="Banner" />

      <div className={commonStyles.container}>
        <div className={styles.post}>
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

          <div>
            {post?.data?.content.map(item => (
              <div key={item.heading} className={styles.section}>
                <h2>{item.heading}</h2>
                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(item.body),
                  }}
                />
              </div>
            ))}
          </div>

          <Comments />

          {preview && (
            <aside>
              <PreviewButton />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 3 }
  );

  const paths =
    posts?.results.map(result => {
      return {
        params: {
          slug: result.uid,
        },
      };
    }) ?? [];
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  return {
    props: {
      post: response,
      preview,
    },
    revalidate: 24 * 60 * 60, // 1 day
  };
};
