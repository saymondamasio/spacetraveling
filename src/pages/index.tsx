import { GetStaticProps } from 'next';
import { useState } from 'react';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { PreviewButton } from '../components/PreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);
  const [loading, setLoading] = useState(false);

  async function getPosts(): Promise<void> {
    setLoading(true);

    await fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(newPosts => {
        setNextPage(newPosts.next_page);
        setPosts(oldPosts => [...oldPosts, ...newPosts.results]);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className={`${commonStyles.container} ${styles.container}`}>
      <div className={styles.posts}>
        {posts.map(post => (
          <div className={styles.post} key={post.uid}>
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>
            <div className={styles.info}>
              <div>
                <FiCalendar size={20} color="#fff" />
                <span>
                  {format(
                    new Date(post.first_publication_date),
                    'dd LLL yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </span>
              </div>

              <div>
                <FiUser size={20} color="#fff" />
                <span>{post.data.author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nextPage && (
        <button
          className={styles.fetchPosts}
          type="button"
          onClick={getPosts}
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Carregar mais posts'}
        </button>
      )}

      {preview && (
        <aside>
          <PreviewButton />
        </aside>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse: PostPagination = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
      preview,
    },
  };
};
